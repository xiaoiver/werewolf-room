<template>
  <div class="room">
    <x-header :left-options="{backText: '返回'}">房间号{{roomId}}</x-header>
    <group label-width="4em" label-margin-right="2em" label-align="right">
        <cell title="房间名" :value="room.name"></cell>
        <cell title="房间人数" :value="currentUserText"></cell>
        <cell title="我" :value="userId"></cell>
        <cell title="上帝" :value="room.god"></cell>
    </group>

    <flexbox
        :gutter="0"
        wrap="wrap"
        class="room__seats"
        v-show="room.status !== 'started'">
        <flexbox-item
            class="room__seat"
            v-for="seat in room.seats"
            :key="seat.idx"
            :span="1/3">
            <x-button @click.native="handleChangeSeat(seat)">
                <badge class="seat__num" :text="seat.idx + 1"></badge>
                <span v-if="seat.userId === null">空闲</span>
                <span v-if="seat.userId === userId">我</span>
                <span v-if="seat.userId !== null && seat.userId !== userId">{{seat.userId}}</span>
            </x-button>
        </flexbox-item>
    </flexbox>

    <template>
        <loading v-model="showWaitingLoading" text="等待其他玩家准备"></loading>
    </template>

    <template v-show="room.status === 'started'">
        <group label-width="4em" label-margin-right="2em" label-align="right">
            <x-switch
                title="你的身份"
                :inline-desc="showMyRole ? myRole : '?'"
                v-model="showMyRole">
            </x-switch>
        </group>
    </template>

    <popup
        v-model="showWolfKillPopup"
        :hide-on-blur="false">
        <div class="wolf-kill-dialog">
            <group title="击杀玩家座位号">
                <x-input title="座位号" v-model="wolfKillSeatIdx"></x-input>
            </group>
            <box gap="10px 10px">
                <x-button @click.native="handleWolfKill" type="primary">确认击杀</x-button>
            </box>
        </div>
    </popup>

    <popup
        v-model="showSeerCheckPopup"
        :hide-on-blur="false">
        <div class="seer-check-dialog">
            <group title="查验玩家座位号">
                <x-input title="座位号" v-model="seerCheckSeatIdx"></x-input>
            </group>
            <template v-show="showSeerCheckResultPopup">
                <group>
                    <cell title="他的身份" :value="seerCheckResult"></cell>
                </group>
            </template>
            <box gap="10px 10px">
                <x-button
                    v-show="!showSeerCheckResultPopup"
                    @click.native="handleSeerCheck" type="primary">确认查验</x-button>
                <x-button 
                    v-show="showSeerCheckResultPopup"
                    @click.native="handleCloseSeerCheckPopup" type="primary">我知道了</x-button>
            </box>
        </div>
    </popup>

    <popup
        v-model="showWitchPopup"
        :hide-on-blur="false">
        <div class="witch-dialog">
            <group label-width="8em" label-margin-right="2em" label-align="right">
                <cell
                    v-show="showWitchSave"
                    title="昨夜死亡玩家" :value="wolfKillResult"></cell>
                <x-switch
                    v-show="showWitchSave"
                    title="使用解药"
                    v-model="witchSaveFlag">
                </x-switch>
                <x-switch
                    v-show="showWitchPoison"
                    title="使用毒药"
                    v-model="witchPoisonFlag">
                </x-switch>
                <x-input
                    v-show="witchPoisonFlag"
                    title="座位号"
                    v-model="witchPoisonSeatIdx"></x-input>
            </group>
            <box gap="10px 10px">
                <x-button
                    v-show="showWitchSave"
                    @click.native="handleWitchSave" type="primary">确认</x-button>
                <x-button 
                    v-show="showWitchPoison"
                    @click.native="handleWitchPoison" type="primary">确认</x-button>
            </box>
        </div>
    </popup>

    <popup
        v-model="showFirstNightResultPopup"
        :hide-on-blur="false">
        <div class="result-dialog">
            <box gap="10px 10px">
                <x-button
                    @click.native="handleShowFirstNightResult" type="primary">揭晓第一晚结果</x-button>
            </box>
        </div>
    </popup>
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex';
import { XButton, Box, GroupTitle, Group, Flexbox, FlexboxItem, Divider, Popup, XNumber, Toast, Cell, Loading, XHeader, Badge, XSwitch, XInput } from 'vux'
import { generateAudio, sleep } from '@/audio'
import {ROLES, ACTION_TYPES} from '@/constants/role'

export default {
    name: 'room',
    components: {
        XButton,
        Box,
        GroupTitle,
        Group,
        Flexbox,
        FlexboxItem,
        Divider,
        Popup,
        XNumber,
        Toast,
        Cell,
        Loading,
        XHeader,
        Badge,
        XSwitch,
        XInput
    },
    data () {
        return {
            gameStarted: false,
            showMyRole: false,
            showWolfKillPopup: false,
            wolfKillSeatIdx: null,
            showSeerCheckPopup: false,
            seerCheckSeatIdx: null,
            showSeerCheckResultPopup: false,
            witchSaveFlag: false,
            witchPoisonFlag: false,
            showWitchPopup: false,
            showWitchSave: false,
            showWitchPoison: false,
            witchPoisonSeatIdx: null,
            showFirstNightResultPopup: false,
        }
    },
    sockets: {
        connect: function () {
            console.log('socket connected')
        },
        BROADCAST_ENTER_ROOM: function ({userId, room}) {
            this.$vux.toast.show({
                text: `${userId}加入房间`
            });
        },
        BROADCAST_LEAVE_ROOM: function ({userId, room}) {
            this.$vux.toast.show({
                text: `${userId}离开房间`
            });
        },
        'PREPARE_GAME': function () {
            let me = this;
            me.$vux.confirm.show({
                title: '提示',
                content: '游戏即将开始',
                onCancel () {},
                onConfirm () {
                    me.$socket.emit('READY_GAME', {
                        roomId: me.roomId,
                        userId: me.userId
                    });
                }
            })
        },
        'WAIT_GAME': function () {},
        'START_GAME': function () {
            this.startGame();
        },
        'BROADCAST_ACT': async function ({actionType, position}) {
            if (actionType === ACTION_TYPES.WOLF_KILL_BEFORE) {
                await generateAudio('狼人请睁眼，今晚你们要杀的是', this.isGod)
                if (this.myRole === '狼人') {
                    this.showWolfKillPopup = true
                }
            }
            else if (actionType === ACTION_TYPES.WOLF_KILL_AFTER) {
                await generateAudio('狼人请闭眼', this.isGod)
                if (this.myRole === '狼人') {
                    this.showWolfKillPopup = false
                }
                if (this.myRole === '女巫') {
                    this.wolfKillSeatIdx = position
                }
                if (this.isGod) {
                    this.$socket.emit('ACT', {
                        roomId: this.roomId,
                        actionType: ACTION_TYPES.SEER_CHECK_BEFORE
                    })
                }
            }
            else if (actionType === ACTION_TYPES.SEER_CHECK_BEFORE) {
                await generateAudio('预言家请睁眼', this.isGod)
                if (this.myRole === '预言家') {
                    this.showSeerCheckPopup = true
                }
                await generateAudio('预言家你要查验的人是', this.isGod)
            }
            else if (actionType === ACTION_TYPES.SEER_CHECK_AFTER) {
                await generateAudio('预言家请闭眼', this.isGod)
                if (this.myRole === '预言家') {
                    this.showSeerCheckPopup = false
                }
                if (this.isGod) {
                    this.$socket.emit('ACT', {
                        roomId: this.roomId,
                        actionType: ACTION_TYPES.WITCH_SAVE_BEFORE
                    })
                }
            }
            else if (actionType === ACTION_TYPES.WITCH_SAVE_BEFORE) {
                await generateAudio('女巫请睁眼', this.isGod)
                if (this.myRole === '女巫') {
                    this.showWitchPopup = true
                }
                await generateAudio('昨夜死亡的玩家是', this.isGod)
                this.showWitchSave = true
                await generateAudio('你有一瓶解药', this.isGod)
                
            }
            else if (actionType === ACTION_TYPES.WITCH_SAVE_AFTER) {
                await generateAudio('你有一瓶毒药', this.isGod)
                if (this.myRole === '女巫') {
                    this.showWitchSave = false
                    this.showWitchPoison = true
                }
            }
            else if (actionType === ACTION_TYPES.WITCH_POISON_AFTER) {
                if (this.myRole === '女巫') {
                    this.showWitchPopup = false
                }
                await generateAudio('女巫请闭眼', this.isGod)
                await sleep(2)
                await generateAudio('要竞选警长的玩家请举手', this.isGod)
                await sleep(2)
                await generateAudio('321', this.isGod)
                await generateAudio('天亮了，请大家睁眼', this.isGod)
                // 隐藏掉每个人的身份
                this.showMyRole = false
                await this.getRoundStatus({
                    roomId: this.roomId,
                    round: 1
                })
                if (this.isGod) {
                    this.showFirstNightResultPopup = true
                }
            }
        },
        BROADCAST_FINISH_GAME: function () {
            // this.$socket.emit('LEAVE_ROOM', {
            //     roomId: this.roomId,
            //     userId: this.userId
            // });
            this.$vux.toast.show({
                text: `第一夜结束，离开房间`
            })
            // 游戏结束所有人返回大厅
            this.$router.push({
                name: 'Hello'
            })
        },
    },
    computed: {
        ...mapGetters([
            'rooms',
            'room',
            'userId',
            'myRole',
            'firstNightResult'
        ]),
        mySeat() {
            return this.room.seats.find(s => s.userId === this.userId);
        },
        currentUserText() {
            return `${this.room.users.length}/${this.room.count}`;
        },
        showWaitingLoading() {
            return this.room.status === 'waiting' && this.mySeat.ready;
        },
        isGod() {
            return this.room.god === this.userId;
        },
        seerCheckResult() {
            return this.room.actions[ACTION_TYPES.SEER_CHECK] ? '狼人' : '好人';
        },
        wolfKillResult() {
            return this.wolfKillSeatIdx;
        }
    },
    methods: {
        ...mapActions([
            'getRooms',
            'getUserRole',
            'getRoomInfo',
            'wolfKill',
            'seerCheck',
            'witchSave',
            'witchPoison',
            'getRoundStatus'
        ]),
        handleChangeSeat(seat) {
            if (seat.userId === this.userId
                || seat.userId !== null) {
                return;
            }
            this.$socket.emit('CHANGE_SEAT', {
                userId: this.userId,
                roomId: this.roomId,
                seat
            })
        },
        async startGame() {
            this.getUserRole({
                roomId: this.roomId,
                position: this.mySeat.idx + 1
            })
            try {
                // 展示身份
                this.showMyRole = true
                // 上帝播放语音
                await generateAudio('游戏开始啦，天黑请闭眼', this.isGod)
                if (this.isGod) {
                    this.$socket.emit('ACT', {
                        roomId: this.roomId,
                        actionType: ACTION_TYPES.WOLF_KILL_BEFORE
                    })
                }
            }
            catch (e) {
                console.log(e)
            }
        },
        async handleWolfKill() {
            await this.wolfKill({
                roomId: this.roomId,
                position: this.wolfKillSeatIdx
            })
            this.$socket.emit('ACT', {
                roomId: this.roomId,
                actionType: ACTION_TYPES.WOLF_KILL_AFTER,
                position: this.wolfKillSeatIdx
            })
        },
        async handleSeerCheck() {
            await this.seerCheck({
                roomId: this.roomId,
                position: this.seerCheckSeatIdx
            })
            await generateAudio('他的身份是', this.isGod)
            this.showSeerCheckResultPopup = true
        },
        async handleCloseSeerCheckPopup() {
            this.$socket.emit('ACT', {
                roomId: this.roomId,
                actionType: ACTION_TYPES.SEER_CHECK_AFTER
            })
        },
        async handleWitchSave() {
            if (this.witchSaveFlag) {
                await this.witchSave({
                    roomId: this.roomId
                })
            }
            this.$socket.emit('ACT', {
                roomId: this.roomId,
                actionType: ACTION_TYPES.WITCH_SAVE_AFTER
            })
        },
        async handleWitchPoison() {
            if (this.witchPoisonFlag) {
                await this.witchPoison({
                    roomId: this.roomId,
                    position: this.witchPoisonSeatIdx
                })
            }
            this.$socket.emit('ACT', {
                roomId: this.roomId,
                actionType: ACTION_TYPES.WITCH_POISON_AFTER
            })
        },
        async handleShowFirstNightResult() {
            await generateAudio('昨夜的结果是', this.isGod)
            await generateAudio(this.firstNightResult, this.isGod)
            this.showFirstNightResultPopup = false
            await sleep(2)
            this.$socket.emit('FINISH_GAME', {
                roomId: this.roomId
            })
        }
    },
    created() {
        this.roomId = this.$route.params.id;
    },
    beforeRouteEnter (to, from, next) {
        next(async vm => {
            let roomId = to.params.id;
            // 进入房间之前查询房间信息
            await vm.getRoomInfo({roomId})
            vm.$socket.emit('ENTER_ROOM', {
                roomId,
                userId: vm.userId,
                userCount: vm.room.count
            });
        });
    },
    beforeRouteUpdate (to, from, next) {
        let roomId = to.params.id;
        this.$socket.emit('ENTER_ROOM', {
            roomId,
            userId: this.userId
        });
        next();
    },
    beforeRouteLeave (to, from, next) {
        let roomId = from.params.id;
        this.$socket.emit('LEAVE_ROOM', {
            roomId,
            userId: this.userId
        });
        next();
    }
}
</script>

<style lang="styl" scoped>
.room
    .room__seats
        .room__seat
            .seat__num
                position absolute
                right 0
</style>
