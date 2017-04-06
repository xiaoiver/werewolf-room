import {Howl} from 'Howler'

/**
 * 使用Howler播放语音
 *
 * @param {string} text 语音文本
 * @param {boolean} force 强制不播放
 * @return {Promise}
 */
export function generateAudio (text, force) {
    return new Promise((resolve, reject) => {
        if (!force) {
            resolve()
            return
        }
        let sound = new Howl({
            src: [`/audio/generate?text=${text}`],
            format: ['mp3']
        })
        sound.once('load', () => {
            sound.play()
        })
        sound.on('end', () => {
            resolve(sound)
        })
        sound.on('loaderror', () => {
            reject(new Error('load audio error'))
        })
    })
}

/**
 * 等待若干秒
 *
 * @param {number} seconds 秒数
 * @return {Promise}
 */
export function sleep (seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, Number(seconds) * 1000)
    })
}