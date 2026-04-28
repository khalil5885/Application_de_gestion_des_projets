import React from 'react';

const tasks = [
  {
    id: 1,
    title: 'Core API Rate Limiter Implementation',
    assignee: { name: 'Jordan D.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbT9OLKDSKS4iUZFOSWiJ2GmygyYQT07t4KwY8jcAIo30uinDLWwvKlyK0UVM8Ezsa2FEwwVJUrfDaClBvAq9kqyMQz8zh2vz2vUgQXjsYq2FBoYo-un5GlZV0L2tz1CKG-Au-VfOYKZjouHuk_omsB2wlEwgkNnjQLBARoQrOt01u6oot6gWOgZ4pkdPgTUuJgMa_FaH_VDC3RHpDYme6c-eeP_WOfyFvBzKR4DUNFnniicADlSt92z_PGSmOT65MeZ36Rdk9hUI' },
    priority: 'High',
    dueDate: 'Oct 24, 2023',
    progress: 75,
    color: 'primary'
  },
  {
    id: 2,
    title: 'User Onboarding Refactor',
    assignee: { name: 'Maya L.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6aD6KQYexTVOcSGoFEdcIyCkbERzZHtcWy7EtNviXUtYNJo7I5PkDrmyuK2uaxFbzvfvVFwFSfuJR1-mS33wbWx3DVf8DpUXjxutTeGGYnNmZ342nL-_eUvM321VFrPm_PXvbKC0HLc8IrXXGk1DZZ3IQPz-XkTw9FWavfDzaDvIWrVRKKif12Fftru0Q6iBecR5Wse5TUZbdqsimFLcJViTEpXZUXHXqwcX49DleA0lTo1q1hvdUx945SELiKLSWP21r_LTOaIE' },
    priority: 'Medium',
    dueDate: 'Oct 26, 2023',
    progress: 32,
    color: 'secondary'
  },
  {
    id: 3,
    title: 'Compliance Documentation',
    assignee: { name: 'Sam K.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAg77-saoi3PYVv2qWC1W6rjIIzF2_wpTjcnt1o_Arxk67tA5QJ4z6-kz_5gJA4hywJx8IOJASWV6N_UAt2X8ogOY7XxdGM45xFw7C4zdK7Gd1UX828r8YUUgj18JkAN08oAGjdT6FPaBaGckEQGqCtBycE5G6MojA_KU-tLhueKyl8NUybopvqil1HjmDlZRJ8Q8tfgID4iVgEPOz5EeHDFW6IWcsrenm-_-pKl1m0t5d0Y2wZB7geOi8SG6liv-RtXuhtitEGz4g' },
    priority: 'Low',
    dueDate: 'Nov 02, 2023',
    progress: 5,
    color: 'outline-variant'
  }
];

export function TaskMatrix() {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
          Active Task Matrix
          <span className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] text-on-surface-variant border border-outline-variant/20">14 Active</span>
        </h3>
        <button className="text-xs font-bold text-primary hover:underline transition-all">View all tasks</button>
      </div>
      <div className="bg-surface-container-low rounded-xl inner-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50 border-b border-outline-variant/10 text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
              <th className="px-6 py-4">Task identifier</th>
              <th className="px-6 py-4">Assignee</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-surface-container-highest/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${task.color} ${task.color === 'primary' ? 'shadow-[0_0_8px_rgba(0,219,233,0.5)]' : task.color === 'secondary' ? 'shadow-[0_0_8px_rgba(255,183,125,0.5)]' : ''}`}></div>
                    <span className={`text-sm font-semibold text-on-surface group-hover:text-${task.color === 'outline-variant' ? 'on-surface' : task.color} transition-colors`}>{task.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <img className="w-6 h-6 rounded-full bg-surface-container-highest object-cover" src={task.assignee.avatar} alt={task.assignee.name} />
                    <span className="text-xs text-on-surface-variant">{task.assignee.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-${task.color}/10 text-${task.color === 'outline-variant' ? 'on-surface-variant' : task.color} border border-${task.color}/20`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-on-surface-variant">{task.dueDate}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full bg-${task.color === 'outline-variant' ? 'on-surface-variant' : task.color}`} style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant">{task.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
