"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cx } from "@/lib/utils"
import { motion } from "framer-motion"
import { useRouter, useSelectedLayoutSegment } from "next/navigation"
import { useEffect, useState } from "react"
import { LinkInternal } from "@/components/ui/link-internal"
import { useGetSigninStatus } from "@/hooks/use-get-signin-status"

const tabNames = ["streak", "weekly", "monthly", "yearly", "lifetime"]

export default function DashboardTabs({ className }: { className?: string }) {
  const [currTab, setCurrTab] = useState(useSelectedLayoutSegment())

  const { isSuccess } = useGetSigninStatus()
  const router = useRouter()
  useEffect(() => {
    if (!isSuccess) {
      router.push("/home")
    }
  }, [isSuccess, router])

  return (
    <Tabs
      defaultValue={currTab ?? undefined}
      className={cx(className, "mt-6 sm:mt-4")}
    >
      <TabsList variant="solid">
        {tabNames.map((tabName) => (
          <TabsTrigger
            key={tabName}
            value={tabName}
            onClick={() => {
              setCurrTab(tabName)
            }}
            className="relative transition"
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {currTab === tabName && (
              <motion.span
                layoutId="bubble"
                className="absolute inset-0 z-10 bg-black rounded-md bg-opacity-20 mix-blend-difference"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <LinkInternal
              prefetch={false}
              className="capitalize"
              href={`/dashboard/${tabName}`}
            >
              {tabName}
            </LinkInternal>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
