/* SYD OMEGA 91717  --  shared file uploader. Exposes window.OmegaStorage. */
(function(){
  if(window.OmegaStorage) return;
  var URL="https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var KEY="sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var MAX=5*1024*1024*1024; // 5 GB client cap
  var ready=window.OmegaSB?window.OmegaSB.get():import('/vendor/supabase-js.js').then(function(m){ return m.createClient(URL,KEY); });
  window.OmegaStorage={
    MAX:MAX,
    ready:ready,
    upload:async function(bucket,file){
      /* Two of the four call sites shipped with these arguments the other way
         round (profile.html KYC, marketplace.html listing). That made
         file.name undefined, threw a TypeError inside this function, and both
         callers swallowed it in a try/catch -- so the upload never ran while
         the page went on to report success. Normalise the order here rather
         than trusting every future caller, and never throw for a bad
         argument: this function's contract is to RETURN {error}. */
      if(typeof bucket!=='string' && typeof file==='string'){ var _b=file; file=bucket; bucket=_b; }
      if(!bucket || typeof bucket!=='string') return {error:'No storage bucket named.'};
      if(!file || typeof file.name!=='string' || typeof file.size!=='number') return {error:'No file chosen.'};
      if(file.size>MAX) return {error:'File exceeds the 5 GB limit.'};
      var sb=await ready;
      var s=(await sb.auth.getSession()).data.session;
      if(!s) return {error:'Sign in first.'};
      var safe=file.name.replace(/[^A-Za-z0-9._-]+/g,'_');
      var path=s.user.id+'/'+Date.now()+'_'+safe;
      var r=await sb.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type||undefined});
      if(r.error) return {error:r.error.message};
      return {path:path,name:file.name,size:file.size};
    },
    remove:async function(bucket,path){
      if(!bucket || typeof bucket!=='string') return {error:'No storage bucket named.'};
      if(!path || typeof path!=='string') return {error:'No storage path.'};
      var sb=await ready;
      var s=(await sb.auth.getSession()).data.session;
      if(!s) return {error:'Sign in first.'};
      /* RLS is authoritative: authenticated members may delete only objects
         whose first path segment is their own user id. Keep the client helper
         deliberately thin so it cannot become a second authorization system. */
      var r=await sb.storage.from(bucket).remove([path]);
      if(r.error) return {error:r.error.message};
      return {path:path};
    },
    publicUrl:async function(bucket,path){ var sb=await ready; return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl; },
    signedUrl:async function(bucket,path,sec){ var sb=await ready; var r=await sb.storage.from(bucket).createSignedUrl(path,sec||3600); return r.data?r.data.signedUrl:null; }
  };
})();
