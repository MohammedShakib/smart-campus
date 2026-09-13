import React from 'react';

export function CampusGraph() {
  const nodes = [
    { id: 'hub',  x: 240, y: 130, r: 8,  type: 'hub',  label: 'Campus Core' },
    { id: 'rA',   x: 100, y: 60,  r: 4,  type: 'room', label: 'Building A' },
    { id: 'rB',   x: 80,  y: 190, r: 4,  type: 'room', label: 'Library' },
    { id: 'rC',   x: 160, y: 40,  r: 4,  type: 'room', label: 'Lab' },
    { id: 'b1',   x: 380, y: 70,  r: 4,  type: 'bus',  label: 'Shuttle' },
    { id: 'b2',   x: 400, y: 170, r: 4,  type: 'bus',  label: 'Shuttle' },
    { id: 'gA',   x: 320, y: 220, r: 4,  type: 'gate', label: 'Main Gate' },
    { id: 'gB',   x: 140, y: 240, r: 4,  type: 'gate', label: 'East Gate' },
    { id: 'tech', x: 340, y: 90,  r: 4,  type: 'room', label: 'Tech Hub' },
  ];
  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[1,2],[4,8],[4,5]];

  return (
    <svg viewBox="0 0 480 260" className="campus-art-svg" aria-hidden="true">
      <defs>
        {edges.map(([ai, bi], i) => {
          const a = nodes[ai], b = nodes[bi];
          return <path key={i} id={`art-ep${i}`} d={`M${a.x},${a.y} L${b.x},${b.y}`} className="art-path-solid" />;
        })}
      </defs>
      
      {edges.map(([ai, bi], i) => {
        const a = nodes[ai], b = nodes[bi];
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="art-path" />;
      })}
      
      {edges.map(([ai, bi], i) => (
        <circle key={`pkt${i}`} r="2" fill="#10B981" opacity="0.8">
          <animate attributeName="opacity" values="0;1;0" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`} />
          <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.4}s`}>
            <mpath href={`#art-ep${i}`} />
          </animateMotion>
        </circle>
      ))}
      
      {nodes.map((node) => {
        const isHub = node.type === 'hub';
        const labelRight = node.x > 240;
        const isCenter = node.id === 'hub';
        
        let nodeClass = "art-node";
        if (isHub) nodeClass = "art-node-solid";
        if (node.type === 'room') nodeClass = "art-node";
        if (node.type === 'gate') nodeClass = "art-node-teal";
        if (node.type === 'bus') nodeClass = "art-node-cyan";

        return (
          <g key={node.id}>
            {isHub && <circle cx={node.x} cy={node.y} r="16" fill="none" stroke="#4F46E5" strokeWidth="1" opacity="0.3" className="art-live-pulse" />}
            {!isHub && <circle cx={node.x} cy={node.y} r={node.r + 2} fill="#ffffff" />}
            <circle cx={node.x} cy={node.y} r={isHub ? 10 : node.r} className={nodeClass} />
            <text
              x={isCenter ? node.x : (labelRight ? node.x + node.r + 8 : node.x - node.r - 8)}
              y={isCenter ? node.y + 18 : node.y + 3.5}
              textAnchor={isCenter ? 'middle' : (labelRight ? 'start' : 'end')}
              className="art-label"
            >{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
