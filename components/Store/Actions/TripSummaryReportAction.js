

export const ACTIONTRIPSUMMARYREPORT="ACTIONTRIPSUMMARYREPORT"

const getActionTripSummaryReport=(data)=>{
    return{
        type:ACTIONTRIPSUMMARYREPORT,
        payload:data
    }
}

export const ActionTripSummaryReport=(data)=>{
return dispatch=>{
    dispatch(getActionTripSummaryReport(data))
}
}
