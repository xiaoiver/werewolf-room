import axios from 'axios';

export function wolfKill(params) {
    return axios('/role/wolf/kill', {
        params
    });
};

export function seerCheck(params) {
    return axios('/role/seer/check', {
        params
    });
};

export function witchPoison(params) {
    return axios('/role/witch/poison', {
        params
    });
};

export function witchSave(params) {
    return axios('/role/witch/save', {
        params
    });
};
