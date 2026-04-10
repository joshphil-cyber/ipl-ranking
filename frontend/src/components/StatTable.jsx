export default function StatTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ipl-border">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(({ label, value, highlight }, i) => (
            <tr
              key={i}
              className={`border-b border-ipl-border last:border-0 ${
                i % 2 === 0 ? 'bg-black/10' : ''
              }`}
            >
              <td className="px-4 py-2.5 text-gray-400">{label}</td>
              <td className={`px-4 py-2.5 font-semibold text-right ${
                highlight ? 'text-ipl-gold' : 'text-white'
              }`}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
