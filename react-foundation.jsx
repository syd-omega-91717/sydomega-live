import React,{useMemo,useState} from 'react';

const modules=[
 {id:'command',name:'Command Center',description:'Search and execute governed platform actions.',icon:'⌘'},
 {id:'agents',name:'Agent Nexus',description:'Discover agents, capabilities and review state.',icon:'◇'},
 {id:'content',name:'Content Studio',description:'Create, organize and review platform content.',icon:'✦'},
 {id:'evidence',name:'Evidence',description:'Inspect runtime evidence and provenance.',icon:'✓'},
 {id:'mission',name:'Mission Control',description:'Track operations, health and delivery.',icon:'◉'},
 {id:'nexus',name:'Intelligence Nexus',description:'Explore relationships between platform capabilities.',icon:'∞'}
];

export function OmegaReactFoundation({onNavigate}){
 const [query,setQuery]=useState('');
 const results=useMemo(()=>modules.filter(m=>(m.name+' '+m.description).toLowerCase().includes(query.toLowerCase())),[query]);
 return <section className="omega-react-foundation" aria-label="Omega React workspace">
   <div className="omega-react-orbit" aria-hidden="true" />
   <div className="omega-react-header"><div><span className="omega-react-kicker">Ω REACT FOUNDATION</span><h2>Mission Workspace</h2><p>A React-driven navigation layer for the sovereign platform.</p></div><span className="omega-react-status">LIVE</span></div>
   <label className="omega-react-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a capability…" aria-label="Find a capability" /></label>
   <div className="omega-react-grid">{results.map(m=><button key={m.id} onClick={()=>onNavigate?.(m.id)} className="omega-react-module"><b>{m.icon}</b><span><strong>{m.name}</strong><small>{m.description}</small></span><i>→</i></button>)}</div>
 </section>
}

export default OmegaReactFoundation;
