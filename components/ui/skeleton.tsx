import { cx } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("animate-pulse rounded-md bg-stone-200", className)}
      {...props}
    />
  )
}
