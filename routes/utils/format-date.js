const formatDate=function(date){
	// input date object, output "yyyy-mm-dd" string
	let month=date.getMonth()+1;
	let monthStr=month<10?'0'+month:month;
	let currD=date.getDate()+1;
	const res=date.getFullYear()+'-'+monthStr+'-'+currD;
	return res;
}

module.exports={formatDate};