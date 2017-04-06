<template>
    <flexbox class="portal"
        justify="center">
        <flexbox-item>
            <box gap="10px 10px">
                <flexbox class="portal-header" justify="center" direction="column">
                    <icon name="signing" scale="5"></icon>
                    <h1 class="portal-title">第一夜法官助手</h1>
                </flexbox>
                <x-button @click.native="showCreateRoom">创建房间</x-button>
                <x-button @click.native="showEnterRoom">加入房间</x-button>
            </box>
        </flexbox-item>

        <popup v-model="showCreateRoomPopup">
            <div class="create-room-dialog">
                <group title="板子">
                    <x-number :min="0" title="狼人数目" v-model="createRoomForm.wolfCount"></x-number>
                    <x-number :min="0" title="平民数目" v-model="createRoomForm.civilianCount"></x-number>
                    <x-number :min="0" :max="1" title="女巫数目" v-model="createRoomForm.witchCount"></x-number>
                    <x-number :min="0" :max="1" title="猎人数目" v-model="createRoomForm.hunterCount"></x-number>
                    <x-number :min="0" :max="1" title="预言家数目" v-model="createRoomForm.seerCount"></x-number>
                    <x-number :min="0" :max="1" title="白痴数目" v-model="createRoomForm.idiotCount"></x-number>
                </group>
                <box gap="10px 10px">
                    <x-button @click.native="handleCreateRoom" type="primary">创建房间</x-button>
                </box>
            </div>
        </popup>

        <popup v-model="showEnterRoomPopup">
            <div class="enter-room-dialog">
                <group title="">
                    <x-input title="房间号" v-model="lastRoomId"></x-input>
                </group>
                <box gap="10px 10px">
                    <x-button @click.native="handleEnterRoom" type="primary">进入房间</x-button>
                </box>
            </div>
        </popup>
    </flexbox>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { XButton, Box, GroupTitle, Group, Flexbox, FlexboxItem, Divider, Popup, XNumber, XInput } from 'vux'
export default {
    name: 'hello',
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
        XInput
    },
    data () {
        return {
            showCreateRoomPopup: false,
            createRoomForm: {
                wolfCount: 1,
                witchCount: 1,
                seerCount: 1,
                hunterCount: 1,
                idiotCount: 1,
                civilianCount: 1
            },
            showEnterRoomPopup: false,
            lastRoomId: null
        }
    },
    sockets: {
        connect: () => {
            console.log('socket connected')
        }
    },
    computed: {
        ...mapGetters([
            'rooms',
            'userId',
            'createdRoomId'
        ])
    },
    methods: {
        ...mapActions([
            'getRooms',
            'createRoom'
        ]),
        showCreateRoom() {
            this.showCreateRoomPopup = true
        },
        showEnterRoom() {
            this.showEnterRoomPopup = true
        },
        async handleCreateRoom() {
            await this.createRoom(this.createRoomForm)
            this.showCreateRoomPopup = false
            this.$router.push({
                name: 'Room',
                params: {
                    id: this.createdRoomId
                }
            })
        },
        handleEnterRoom() {
            this.showCreateRoomPopup = false
            this.$router.push({
                name: 'Room',
                params: {
                    id: this.lastRoomId
                }
            })
        }
    },
    created() {
        // this.getRooms();
    }
}
</script>

<style scoped lang="styl">
.portal
    padding 100px 0
    .portal-header
        padding-bottom 100px
        .portal-title
            padding 6px 0
</style>
