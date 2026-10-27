export async function api(route,{method='GET',body}={}) {
 const response=await fetch(new URL('./api/'+route,document.baseURI),{method,credentials:'same-origin',cache:'no-store',headers:{...(method!=='GET'?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 let data;try{data=await response.json();}catch{throw Error('The private beta service is not connected. No action has been confirmed.');}
 if(!response.ok){const error=Error(data.error||'Request failed. Nothing has been confirmed.');error.status=response.status;throw error;}return data;
}
