#!/usr/bin/env node
const fs=require('fs');
const html=fs.readFileSync('invest.html','utf8');
const js=fs.readFileSync('omega-invest-native.js','utf8');
for(const x of ['wallet_accounts','wallet_transactions','token_balances','omega_investment_watchlists','payments','SIGN_IN_REQUIRED','UNAVAILABLE','never converts a record count into a balance']) if(!js.includes(x)) throw new Error('missing INVEST native contract: '+x);
if(!html.includes('omega-invest-native.js')) throw new Error('invest.html missing native script');
if(html.includes('hardcoded')&&/balance.{0,40}=[0-9]/i.test(html)) throw new Error('possible fabricated balance');
console.log('OMEGA_INVEST_NATIVE_CONSOLIDATION=PASS');
