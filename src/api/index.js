import * as room from './room';
import * as role from './role';

let api = Object.assign({}, room, role);

const DEAULT_ERROR_MSG = '出错啦';

Object.keys(api).forEach(apiName => {
    let request = api[apiName];
    api[apiName] = (params) => {
        return new Promise(async (resolve, reject) => {
            try {
                let ret = await request(params);
                if (!ret || !ret.data || ret.data.errNo !== 0) {
                    reject(ret && ret.data && ret.data.errMsg || DEAULT_ERROR_MSG);
                    return;
                }
                resolve(ret.data.data);
            }
            catch (e) {
                reject(e && e.msg || DEAULT_ERROR_MSG);
            }
        });
    };
});

export default api;