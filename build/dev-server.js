require('./check-versions')()

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var fs = require('fs')
var bodyParser = require('body-parser')
var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
if (!config.dev.env.MOCK) {
  Object.keys(proxyTable).forEach(function (context) {
    var options = proxyTable[context]
    if (typeof options === 'string') {
      options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
  })
}

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

app.use(/\/audio/, (req, res, next) => {
    if (config.dev.env.MOCK) {
      console.log('audio...')
      var mockAudioFile = path.join(__dirname, '../mockup/mockAudio.mp3');
      res.attachment(mockAudioFile);
    }
    next();
});

// mock up
var mockup = function (reqPath, reqParams) {
    if (reqPath.indexOf('?') !== -1) {
        reqPath = reqPath.substring(0, reqPath.indexOf('?'));
    }
    var filePath = path.join(__dirname, '../mockup/', reqPath + '.js');

    if (fs.existsSync(filePath)) {
        var response;

        if (fs.existsSync(filePath)) {
            if (require.cache[require.resolve(filePath)]) {
                delete require.cache[require.resolve(filePath)];
            }
            response = require(filePath)(reqParams);
        }
        return response;
    }
    return false;
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(/\/api|\/room|\/role|\/audio/, (req, res, next) => {
    if (config.dev.env.MOCK) {
      if (req.baseUrl.indexOf('audio') > -1) {
        console.log('audio...')
        var mockAudioFile = path.join(__dirname, '../mockup/mockAudio.mp3');
        res.attachment(mockAudioFile);
      }
      else {
        console.log('mock...')
        res.json(mockup(req.baseUrl + req.path, req.method === 'GET' ? req.query : req.body));
      }
    }
    next();
});

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

var userId = 0;
var rooms = {}; // 房间信息
var socketUserMap = {}; // socketID和用户ID映射
var socketRoomMap = {};

var generateUserId = () => {
  return `玩家${userId++}`;
}

var io = require('socket.io')(server);
io.on('connection', (socket) => {
  let userId = generateUserId()
  socketUserMap[socket.id] = userId

  // 分配userId
  io.emit('ASSIGN_USER_ID', {
    userId: userId
  })

  var leaveRoom = ({roomId, userId}, skipBroadcast) => {
    if (roomId !== null && roomId !== undefined) {
      var currentRoom = rooms[roomId]
      if (currentRoom) {
        var index = currentRoom.users.indexOf(userId)
        if (index !== -1) {
          currentRoom.users.splice(index, 1)
        }
        var {seats} = currentRoom
        seats.forEach((s) => {
          if (s.userId === userId) {
            s.userId = null
          }
        })
        socket.leave(roomId)
        // 如果是上帝，清除
        if (currentRoom.god === userId) {
          currentRoom.god = null
        }
        delete socketRoomMap[socket.id]
        if (!skipBroadcast) {
          io.to(roomId).emit('BROADCAST_LEAVE_ROOM', {
            userId,
            room: currentRoom
          })
        }
      }
    }
  }

  // 连接中断时
  socket.on('disconnect', () => {
    let userId = socketUserMap[socket.id]
    if (userId) {
      let roomId = socketRoomMap[socket.id]
      // 此用户在房间中，触发离开事件
      if (roomId) {
        leaveRoom({roomId, userId})
        delete socketUserMap[socket.id]
      }
    }
  })

  socket.on('ENTER_ROOM', ({roomId, userId, userCount}) => {
    if (!rooms[roomId]) {
      var seats = [];
      for (let i = 0; i < userCount; i++) {
        seats.push({
          idx: i,
          userId: null,
          ready: false
        })
      }
      rooms[roomId] = {
        users: [],
        seats,
        god: userId
      }
    }
    var currentRoom = rooms[roomId]
    currentRoom.users.push(userId)
    // 加入房间
    socket.join(roomId)
    socketRoomMap[socket.id] = roomId
    // 通知房间内人员
    io.to(roomId).emit('BROADCAST_ENTER_ROOM', {
      userId,
      room: currentRoom
    })
  })

  socket.on('LEAVE_ROOM', ({roomId, userId, skipBroadcast = false}) => {
    leaveRoom({roomId, userId}, skipBroadcast)
  })

  socket.on('CHANGE_SEAT', ({roomId, userId, seat}) => {
    var {seats} = rooms[roomId]
    seats.forEach((s) => {
      if (s.userId === userId) {
        s.userId = null
      }
    })
    seats[seat.idx].userId = userId
    // 通知房间内人员
    io.to(roomId).emit('BROADCAST_CHANGE_SEAT', {
      userId,
      room: rooms[roomId]
    })
    // 坐满开始游戏
    if (seats.every(s => s.userId !== null)) {
      io.to(roomId).emit('PREPARE_GAME')
    }
  })

  socket.on('READY_GAME', ({roomId, userId}) => {
    var {seats} = rooms[roomId]
    seats.forEach((s) => {
      if (s.userId === userId) {
        s.ready = true
      }
    })
    // 通知房间内人员
    io.to(roomId).emit('BROADCAST_CHANGE_SEAT', {
      userId,
      room: rooms[roomId]
    })
    // 全部准备完毕正式开始
    if (seats.every(s => s.ready)) {
      io.to(roomId).emit('START_GAME')
    }
    else {
      io.to(roomId).emit('WAIT_GAME')
    }
  })

  socket.on('ACT', ({roomId, actionType, position}) => {
    // 通知房间内人员
    io.to(roomId).emit('BROADCAST_ACT', {actionType, position})
  })

  socket.on('FINISH_GAME', ({roomId}) => {
    io.to(roomId).emit('BROADCAST_FINISH_GAME')
  })
})

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
