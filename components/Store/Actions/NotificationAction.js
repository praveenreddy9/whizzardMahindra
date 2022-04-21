

export const ACTIONNOTIFICATION="ACTIONNOTIFICATION"

const getActionNotification=(data)=>{
    return{
        type:ACTIONNOTIFICATION,
        payload:data
    }
}

export const ActionUserLogHistory=(data)=>{
return dispatch=>{
    dispatch(getActionNotification())
}
}
