

export const ACTIONPENDINGUSERS="ACTIONPENDINGUSERS"

const getActionPendingusers=(data)=>{
    return{
        type:ACTIONPENDINGUSERS,
        payload:data
    }
}

export const ActionPendingUsers=(data)=>{
return dispatch=>{
    dispatch(getActionPendingusers(data))
}
}
