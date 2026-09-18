const sb=window.supabase.createClient(BANANA_CONFIG.SUPABASE_URL,BANANA_CONFIG.SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id); let mode="login", a=0,b=0;
function captcha(){a=Math.floor(Math.random()*30)+10;b=Math.floor(Math.random()*20)+1;$("captchaQ").textContent=`${a} + ${b} = ?`;$("captcha").value=""}
function setMode(m){mode=m;$("tabLogin").classList.toggle("active",m==="login");$("tabSignup").classList.toggle("active",m==="signup");$("authTitle").textContent=m==="login"?"خوش آمدی 👋":"ساخت حساب جدید";$("authSub").textContent=m==="login"?"برای ادامه وارد حساب خودت شو.":"یک حساب Banana بساز."; $("emailLabel").style.display=m==="login"?"block":"block";$("authBtn").textContent=m==="login"?"ورود":"ثبت‌نام";captcha()}
$("tabLogin").onclick=()=>setMode("login");$("tabSignup").onclick=()=>setMode("signup");$("refreshCaptcha").onclick=captcha;captcha();
function cleanUser(v){return v.trim().toLowerCase().replace(/[^a-z0-9_\.]/g,"")}
$("authForm").onsubmit=async e=>{e.preventDefault();$("authMsg").textContent="";
if(Number($("captcha").value)!==a+b){$("authMsg").textContent="پاسخ کپچا اشتباه است.";captcha();return}
const username=cleanUser($("username").value);const email=$("email").value.trim();const password=$("password").value;
try{
 if(mode==="signup"){
  if(username.length<3){throw Error("نام کاربری حداقل ۳ کاراکتر باشد.");}
  const {data,error}=await sb.auth.signUp({email,password,options:{data:{username}}});if(error)throw error;
  if(data.session){await ensureProfile(username);location.href=base()+"home";}else $("authMsg").style.color="#3c7d31",$("authMsg").textContent="ثبت‌نام انجام شد؛ ایمیل را تأیید کن و سپس وارد شو.";
 }else{
  const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;
  const ok=await checkBan();if(!ok)return;location.href=base()+"home";
 }
}catch(err){$("authMsg").textContent=err.message||"خطا در عملیات."}
}
async function ensureProfile(username){const {data:u}=await sb.auth.getUser();if(u.user)await sb.from("profiles").upsert({id:u.user.id,username,display_name:username},{onConflict:"id"});}
async function checkBan(){const {data:u}=await sb.auth.getUser();if(!u.user)return false;const {data}=await sb.rpc("get_my_ban_status",{p_user_id:u.user.id,p_device_id:deviceId()});if(data?.blocked){$("authMsg").textContent=`دسترسی مسدود است. دلیل: ${data.reason||"—"} | پایان: ${data.until_at?new Date(data.until_at).toLocaleString("fa-IR"):"نامشخص"}`;await sb.auth.signOut();return false}return true}
function deviceId(){let k="banana_device_id",v=localStorage.getItem(k);if(!v){v=crypto.randomUUID();localStorage.setItem(k,v)}return v}
function base(){let p=location.pathname;return p.substring(0,p.lastIndexOf("/")+1)}
(async()=>{const {data:{session}}=await sb.auth.getSession();if(session){if(await checkBan())location.href=base()+"home";}})();
