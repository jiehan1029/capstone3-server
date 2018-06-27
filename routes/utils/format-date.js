const formatDate=function(date){
	// input date object, output "yyyy-mm-dd" string
	let month=date.getMonth()+1;
	let monthStr=month<10?'0'+month:month;
	let currD=date.getDate()+1;
	const res=date.getFullYear()+'-'+monthStr+'-'+currD;
	return res;
}

const strToDate=function(dateStr){
	// input date string (yyyy-mm-dd), output date object
	return new Date(dateStr);
}

module.exports={formatDate, strToDate};

