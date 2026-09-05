/* A Supabase-client stub good enough to keep an authenticated, approved member
   on the page. Without it every gated page redirects to /account.html (no
   session) or /pending.html (no approved profile), so nothing on the page can
   be tested. Query chains record whether .single()/.maybeSingle() was used so
   the resolved shape is an object rather than an array in that case. */
const UID = '00000000-0000-0000-0000-000000000001';
module.exports.UID = UID;
module.exports.STUB = `
const UID='${UID}';
/* created_at is on the real Supabase session user object, and code that
   reasons about when an account began (habits.html's seeded-history purge)
   silently no-ops without it -- the stub was less faithful than production,
   so the branch could not be exercised. Matches PROFILE.created_at below. */
const SESSION={user:{id:UID,email:'member@example.com',created_at:'2026-01-01T00:00:00Z'},access_token:'stub'};
const PROFILE={id:UID,email:'member@example.com',display_name:'Test Member',
  access_approved:true,is_trial:false,is_rejected:false,is_owner:false,
  sign:'Aries',element:'fire',god:'Ares',agent:'Sentinel',token:'ARENITE',
  axis_a:3,axis_b:3,axis_c:3,authority:9.1,nodes_earned:12,
  membership_tier:'sovereign',subscription_status:'active',
  certificates_earned:1,trophies_earned:1,medals_earned:1,
  trial_expires_at:null,created_at:'2026-01-01T00:00:00Z',matrix_phase:1,
  /* bg.js:1002 redirects to /terms.html when sign is set but this is falsy */
  terms_accepted:true, terms_accepted_at:'2026-01-01T00:00:00Z'};

function chain(state){
  const self={};
  const ret=()=>chain(state);
  ['select','eq','neq','gt','gte','lt','lte','like','ilike','is','in','contains',
   'order','limit','range','filter','not','or','match','insert','update','upsert',
   'delete','abortSignal','csv','explain','returns','overrideTypes','throwOnError'
  ].forEach(k=>{ self[k]=()=>ret(); });
  self.single=()=>chain(Object.assign({},state,{single:true}));
  self.maybeSingle=()=>chain(Object.assign({},state,{single:true}));
  self.then=(res,rej)=>{
    const payload = state.single
      ? {data:PROFILE,error:null,count:1,status:200}
      : {data:[],error:null,count:0,status:200};
    return Promise.resolve(payload).then(res,rej);
  };
  self.catch=(f)=>Promise.resolve({data:state.single?PROFILE:[],error:null}).catch(f);
  self.finally=(f)=>Promise.resolve({data:state.single?PROFILE:[],error:null}).finally(f);
  return self;
}

export function createClient(){
  return {
    auth:{
      getSession: async()=>({data:{session:SESSION},error:null}),
      getUser:    async()=>({data:{user:SESSION.user},error:null}),
      onAuthStateChange: ()=>({data:{subscription:{unsubscribe(){}}}}),
      signOut:    async()=>({error:null}),
      signInWithPassword: async()=>({data:{session:SESSION,user:SESSION.user},error:null}),
      signUp:     async()=>({data:{session:SESSION,user:SESSION.user},error:null}),
      resetPasswordForEmail: async()=>({data:{},error:null}),
      updateUser: async()=>({data:{user:SESSION.user},error:null})
    },
    from: ()=>chain({}),
    rpc:  ()=>chain({}),
    channel: ()=>({ on(){return this;}, subscribe(){return this;}, unsubscribe(){} }),
    removeChannel(){}, removeAllChannels(){},
    storage:{ from: ()=>({
      upload: async()=>({data:{path:'x'},error:null}),
      download: async()=>({data:new Blob([]),error:null}),
      getPublicUrl: ()=>({data:{publicUrl:'/icon-192.png'}}),
      createSignedUrl: async()=>({data:{signedUrl:'/icon-192.png'},error:null}),
      remove: async()=>({data:[],error:null}), list: async()=>({data:[],error:null})
    })},
    functions:{ invoke: async()=>({data:{},error:null}) }
  };
}
export default { createClient };
`;
