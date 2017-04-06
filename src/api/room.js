import axios from 'axios';

export function getRooms(queryParams) {
    return axios('/api/getRooms', {
        params: queryParams
    });
};

export function createRoom(params) {
    return axios('/room/createRoom', {
        params
    });
};

export function getUserRole(params) {
    return axios('/room/getUserRole', {
        params
    });
};

export function getRoomInfo(params) {
    return axios('/room/getRoomInfo', {
        params
    });
};

export function getRoundStatus(params) {
    return axios('/room/getRoundStatus', {
        params
    });
};

