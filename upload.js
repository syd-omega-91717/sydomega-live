/* SYD OMEGA 91717 — shared file uploader. Exposes window.OmegaStorage. */
(function(){
  if(window.OmegaStorage) return;
  var URL="https://ydqhzvvoyufiiqvzcjns.supabase.co";
  var KEY="sb_publishable_9KlhhnvRs4OKgw6nxXHmYw_GxszJ46q";
  var MAX=5*1024*1024*1024; // 5 GB client cap
  var ready=import('https://esm.sh/@supabase/supabase-js@2').then(function(m){ return m.createClient(URL,KEY); });
  window.OmegaStorage={
    MAX:MAX,
    ready:ready,
    upload:async function(bucket,file){
      if(!file) return {error:'No file chosen.'};
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
    publicUrl:async function(bucket,path){ var sb=await ready; return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl; },
    signedUrl:async function(bucket,path,sec){ var sb=await ready; var r=await sb.storage.from(bucket).createSignedUrl(path,sec||3600); return r.data?r.data.signedUrl:null; }
  };
})();
