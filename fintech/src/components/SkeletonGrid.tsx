import { motion } from 'framer-motion';

const years = ['2023A', '2024E', '2025E', '2026E'];

function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
    >
      {/* Label cell */}
      <td className="px-4 py-3 border-b theme-border">
        <div
          className="h-4 w-32 skeleton-cell"
          style={{ animationDelay: `${delay * 100}ms` }}
        />
      </td>
      {/* Year cells */}
      {years.map((year, idx) => (
        <td key={year} className="px-3 py-3 border-b theme-border text-end">
          <div className="flex flex-col items-end gap-1">
            <div
              className="h-4 w-16 skeleton-cell"
              style={{ animationDelay: `${(delay + idx * 0.05) * 100}ms` }}
            />
            <div
              className="h-3 w-10 skeleton-cell opacity-60"
              style={{ animationDelay: `${(delay + idx * 0.05 + 0.02) * 100}ms` }}
            />
          </div>
        </td>
      ))}
    </motion.tr>
  );
}

function SkeletonSection({ rowCount, delay }: { rowCount: number; delay: number }) {
  return (
    <>
      {/* Section Header */}
      <tr className="theme-bg-tertiary">
        <td colSpan={5} className="px-4 py-2 border-b theme-border">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 skeleton-cell rounded" />
            <div
              className="h-4 w-28 skeleton-cell"
              style={{ animationDelay: `${delay * 100}ms` }}
            />
          </div>
        </td>
      </tr>
      {/* Section Rows */}
      {Array.from({ length: rowCount }).map((_, idx) => (
        <SkeletonRow key={idx} delay={delay + (idx + 1) * 0.05} />
      ))}
    </>
  );
}

export function SkeletonGrid() {
  return (
    <div className="theme-bg-tertiary rounded-xl border theme-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b theme-border theme-bg-secondary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-48 skeleton-cell" />
          <div className="h-5 w-24 skeleton-cell opacity-60" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 skeleton-cell rounded-lg" />
          <div className="h-8 w-8 skeleton-cell rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="theme-bg-secondary">
              <th className="px-4 py-3 text-start text-xs font-semibold theme-text-muted uppercase tracking-wider border-b theme-border min-w-[260px]">
                <div className="h-3 w-20 skeleton-cell" />
              </th>
              {years.map((year, idx) => (
                <th
                  key={year}
                  className="px-3 py-3 text-end text-xs font-semibold uppercase tracking-wider border-b theme-border min-w-[110px]"
                >
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className="h-3 w-12 skeleton-cell"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    />
                    <div
                      className="h-2 w-16 skeleton-cell opacity-60"
                      style={{ animationDelay: `${idx * 50 + 20}ms` }}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SkeletonSection rowCount={3} delay={0.1} />
            <SkeletonSection rowCount={5} delay={0.3} />
            <SkeletonSection rowCount={4} delay={0.5} />
            <SkeletonSection rowCount={6} delay={0.7} />
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t theme-border theme-bg-secondary flex items-center justify-between">
        <div className="h-4 w-32 skeleton-cell" />
        <div className="h-4 w-24 skeleton-cell" />
      </div>
    </div>
  );
}
