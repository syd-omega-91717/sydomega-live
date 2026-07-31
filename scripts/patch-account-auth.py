#!/usr/bin/env python3
"""
Patch account.html's signup/login flow.

Run from the repository root:  python3 scripts/patch-account-auth.py
Add --dry-run to preview. Creates account.html.bak.

FIXES FOUR THINGS
-----------------
1. signUp() sends no emailRedirectTo, so the confirmation link uses whatever
   Site URL is set in the Supabase dashboard. If that is stale, the link 404s.
   Now set explicitly to this origin.

2. Supabase deliberately returns a SUCCESS response when you sign up with an
   already-registered email (anti-enumeration). The current code then shows
   "Account created. Confirm via email if prompted" — so a returning member is
   told to check an inbox that will never receive anything. Now detected via
   the empty `identities` array and reported honestly.

3. "Invalid login credentials" is shown raw. It means either no such account
   OR wrong password — never "unconfirmed email", which returns its own
   distinct error. The message now says so, and offers the reset link.

4. No way to re-send a confirmation email. Added.
"""
import os, re, shutil, sys

DRY = "--dry-run" in sys.argv
T = "account.html"

NEW_SIGNUP = '''  async function signUp(){
    const email=document.getElementById('au-email').value.trim();
    const pw=document.getElementById('au-pw').value;
    const msg=document.getElementById('au-msg');
    if(!email || pw.length<6){ msg.className='msg bad'; msg.textContent='Enter an email and a password of at least 6 characters.'; return; }
    msg.className='msg'; msg.textContent='Creating your account...';
    /* emailRedirectTo must be explicit: without it the confirmation link uses
       the dashboard Site URL, which breaks silently if that is stale. */
    const { data, error } = await supabase.auth.signUp({
      email, password:pw,
      options:{ emailRedirectTo: window.location.origin + '/account.html' }
    });
    if(error){ msg.className='msg bad'; msg.textContent=error.message; return; }
    /* Supabase returns success for an ALREADY-REGISTERED email to prevent
       address enumeration, with an empty identities array. Without this check
       a returning member is told to check an inbox that gets nothing. */
    if(data && data.user && Array.isArray(data.user.identities) && data.user.identities.length===0){
      msg.className='msg bad';
      msg.innerHTML='This email is already registered. Use <b>Log in</b>, or <a href="/reset.html">reset your password</a>.';
      return;
    }
    if(data.session){ msg.textContent=''; return; }
    msg.className='msg ok';
    msg.innerHTML='Account created. Check your inbox to confirm — including spam. '+
      'Nothing arrived? <a href="#" id="au-resend">Send it again</a>.';
    const rs=document.getElementById('au-resend');
    if(rs) rs.addEventListener('click', function(ev){ ev.preventDefault(); resendConfirm(); });
  }

  async function resendConfirm(){
    const email=document.getElementById('au-email').value.trim();
    const msg=document.getElementById('au-msg');
    if(!email){ msg.className='msg bad'; msg.textContent='Enter your email first.'; return; }
    msg.className='msg'; msg.textContent='Sending...';
    const { error } = await supabase.auth.resend({
      type:'signup', email,
      options:{ emailRedirectTo: window.location.origin + '/account.html' }
    });
    if(error){
      msg.className='msg bad';
      msg.textContent = /rate|limit|seconds/i.test(error.message)
        ? 'Too many emails sent recently. Wait a few minutes and try again.'
        : error.message;
      return;
    }
    msg.className='msg ok';
    msg.textContent='Sent. If it still does not arrive, the platform email service may not be configured — contact the owner.';
  }
'''

NEW_LOGIN = '''  async function logIn(){
    const email=document.getElementById('au-email').value.trim();
    const pw=document.getElementById('au-pw').value;
    const msg=document.getElementById('au-msg');
    if(!email || !pw){ msg.className='msg bad'; msg.textContent='Enter your email and password.'; return; }
    msg.className='msg'; msg.textContent='Signing in...';
    const { error } = await supabase.auth.signInWithPassword({ email, password:pw });
    if(error){
      msg.className='msg bad';
      /* Supabase's raw strings are misleading to members. "Invalid login
         credentials" means no such account OR wrong password — it does NOT
         mean unconfirmed, which has its own distinct error. */
      if(/invalid login credentials/i.test(error.message)){
        msg.innerHTML='That email and password did not match an account. '+
          'Either the password is wrong, or no account exists for this address. '+
          '<a href="/reset.html">Reset your password</a>, or use <b>Sign up</b> if you are new.';
      } else if(/email not confirmed/i.test(error.message)){
        msg.innerHTML='Your email is not confirmed yet. '+
          '<a href="#" id="au-resend2">Send the confirmation email again</a>.';
        const r2=document.getElementById('au-resend2');
        if(r2) r2.addEventListener('click', function(ev){ ev.preventDefault(); resendConfirm(); });
      } else {
        msg.textContent=error.message;
      }
      return;
    }
    msg.textContent='';
  }
'''

def main():
    if not os.path.exists(T):
        sys.exit("ERROR: account.html not found. Run from the repository root.")
    src = open(T, encoding="utf-8").read()
    if "au-resend" in src:
        print("Already patched. Nothing to do."); return 0

    out, done = src, []

    m = re.search(r"  async function signUp\(\)\{.*?\n  \}\n", out, re.S)
    if m: out = out[:m.start()] + NEW_SIGNUP + out[m.end():]; done.append("signUp + resendConfirm")
    else: print("WARN: signUp() block not matched — patch by hand.")

    m = re.search(r"  async function logIn\(\)\{.*?\n  \}\n", out, re.S)
    if m: out = out[:m.start()] + NEW_LOGIN + out[m.end():]; done.append("logIn")
    else: print("WARN: logIn() block not matched — patch by hand.")

    if not done: sys.exit("Nothing patched.")
    print("Patched: " + ", ".join(done))
    if DRY: print("--dry-run: nothing written."); return 0

    shutil.copy2(T, T + ".bak")
    open(T, "w", encoding="utf-8").write(out)
    print(f"Written. Backup at {T}.bak")
    return 0

if __name__ == "__main__":
    sys.exit(main())
