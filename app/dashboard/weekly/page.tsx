"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { Stat } from "@/components/stat"

export default function Weekly() {
  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["weekly"],
    queryFn: async () => {
      const response = await fetch(`/api/py/weekly`)
      const data = await response.json()
      return data
    },
  })

  if (isError) {
    return <p>Error: {error.message}</p>
  }

  if (isLoading || !data) {
    return <div></div>
  }

  return (
    <>
      <div className="grid gap-6 mt-9 sm:mt-6 sm:grid-cols-3">
        <Stat
          title="Total sessions"
          value={data.total.sessions}
          changeVal={data.total.sessions - data.prev.sessions}
          changeText="vs. previous week"
          useNumberSign
        />
        <Stat
          title="Total hours"
          value={data.total.hours}
          changeVal={data.total.hours - data.prev.hours}
          changeText="vs. previous week"
          useNumberSign
        />
        <Stat
          title="Total partners"
          value={data.total.partners}
          changeVal={data.total.repeat_partners}
          changeText="repeat"
        />
      </div>
    </>
  )
}
