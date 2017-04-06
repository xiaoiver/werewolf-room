import Vue from 'vue'
import Vuex from 'vuex'
import api from '@/api'
import {ACTION_TYPES} from '@/constants/role'

Vue.use(Vuex);

const initialState = {
    connect: false,
    message: null,
    userId: null, // 分配的用户id
    myRole: null, // 我的角色名
    rooms: [], // 房间列表
    room: { // 当前房间
        status: 'init', // 房间状态
        users: [], // 用户
        seats: [], // 座位信息
        god: null, // 上帝
        count: null, // 人数
        name: '', // 房间名
        actions: {}, // 动作
    },
    createdRoomId: null,
    firstNightResult: ''
}

export default new Vuex.Store({
    state: JSON.parse(JSON.stringify(initialState)),
    getters: {
        rooms: (state) => state.rooms,
        room: (state) => state.room,
        createdRoomId: (state) => state.createdRoomId,
        userId: (state) => state.userId,
        myRole: (state) => state.myRole,
        firstNightResult: (state) => state.firstNightResult
    },
    mutations: {
        SOCKET_CONNECT: (state) => {
            state.connect = true;
        },
        SOCKET_ASSIGN_USER_ID: (state, {userId}) => {
            if (state.userId === null) {
                state.userId = userId;
            }
        },
        SOCKET_BROADCAST_ENTER_ROOM: (state, {userId, room}) => {
            state.room.users = room.users;
            state.room.seats = room.seats;
            if (state.room.god === null) {
                state.room.god = room.god;
            }
        },
        SOCKET_BROADCAST_LEAVE_ROOM: (state, {userId, room}) => {
            state.room.users = room.users;
            state.room.seats = room.seats;
        },
        SOCKET_BROADCAST_CHANGE_SEAT: (state, {userId, room}) => {
            state.room.users = room.users;
            state.room.seats = room.seats;
        },
        SOCKET_PREPARE_GAME: (state) => {
            state.room.status = 'pending';
        },
        SOCKET_WAIT_GAME: (state) => {
            state.room.status = 'waiting';
        },
        SOCKET_START_GAME: (state) => {
            state.room.status = 'started';
        },
        SOCKET_BROADCAST_FINISH_GAME: (state) => {
            let {connect, userId, ...anotherState} = initialState
            anotherState = JSON.parse(JSON.stringify(anotherState))
            console.log(anotherState)
            for (let f in anotherState) {
                Vue.set(state, f, anotherState[f]);
            }
        },
        SET_ROOMS: (state, rooms) => {
            state.rooms = rooms;
        },
        SET_CREATED_ROOM_ID: (state, roomId) => {
            state.createdRoomId = roomId;
        },
        SET_MY_ROLE: (state, role) => {
            state.myRole = role;
        },
        SET_ROOM_BASE_INFO: (state, room) => {
            state.room.count = room.total;
            state.room.name = room.organization;
        },
        SET_ACTION: (state, {actionType, seatIdx}) => {
            Vue.set(state.room.actions, actionType, seatIdx)
        },
        SET_FIRST_NIGHT_RESULT: (state, {firstNightResult}) => {
            state.firstNightResult = firstNightResult
        }
    },
    actions: {
        async getRooms ({ commit, dispatch, state }) {
            commit('SET_ROOMS', await api.getRooms());
        },
        async createRoom ({ commit, dispatch, state }, params) {
            let ret = await api.createRoom(params);
            commit('SET_CREATED_ROOM_ID', ret.roomId);
        },
        async getUserRole ({ commit, dispatch, state }, params) {
            let ret = await api.getUserRole(params);
            commit('SET_MY_ROLE', ret.role);
        },
        async getRoomInfo ({ commit, dispatch, state }, params) {
            commit('SET_ROOM_BASE_INFO', await api.getRoomInfo(params));
        },
        async wolfKill ({ commit, dispatch, state }, params) {
            let {killed} = await api.wolfKill(params)
            commit('SET_ACTION', {
                actionType: ACTION_TYPES.WOLF_KILL,
                seatIdx: killed
            });
        },
        async seerCheck ({ commit, dispatch, state }, params) {
            let {checked} = await api.seerCheck(params)
            commit('SET_ACTION', {
                actionType: ACTION_TYPES.SEER_CHECK,
                seatIdx: checked
            });
        },
        async witchSave ({ commit, dispatch, state }, params) {
            let {antiDoteUsed} = await api.witchSave(params)
            commit('SET_ACTION', {
                actionType: ACTION_TYPES.WITCH_SAVE,
                seatIdx: antiDoteUsed
            });
        },
        async witchPoison ({ commit, dispatch, state }, params) {
            let {poisonUsed} = await api.witchPoison(params)
            commit('SET_ACTION', {
                actionType: ACTION_TYPES.WITCH_POISON,
                seatIdx: poisonUsed
            });
        },
        async getRoundStatus ({ commit, dispatch, state }, params) {
            let {result} = await api.getRoundStatus(params)
            commit('SET_FIRST_NIGHT_RESULT', {
                firstNightResult: result
            });
        }
    }
})