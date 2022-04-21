

export const ACTIONSIGNUP="ACTIONSIGNUP"

const getActionSignUp=(data)=>{
    return{
        type:ACTIONSIGNUP,
        payload:data
    }
}

export const ActionSignUp=(data)=>{
return dispatch=>{
    dispatch(getActionSignUp(data))
}
}
