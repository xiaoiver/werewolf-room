export const ROLES = {
    WOLF: 'ROLE_WOLF',
    WITCH: 'ROLE_WITCH',
    SEER: 'ROLE_SEER',
    HUNTER: 'ROLE_HUNTER',
    WITCH: 'ROLE_WITCH',
    IDIOT: 'ROLE_IDIOT',
    CIVILIAN: 'ROLE_CIVILIAN'
}

let initActions = {
    WOLF_KILL: 'AT_WOLF_KILL',
    SEER_CHECK: 'AT_SEER_CHECK',
    WITCH_POISON: 'AT_WITCH_POISON',
    WITCH_SAVE: 'AT_WITCH_SAVE'
}
let actions = {};
Object.keys(initActions).forEach(action => {
    actions[`${action}_BEFORE`] = `${initActions[action]}_BEFORE`
    actions[action] = initActions[action]
    actions[`${action}_AFTER`] = `${initActions[action]}_AFTER`
})

export const ACTION_TYPES = actions