"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { useGetSigninStatus } from "@/hooks/use-get-signin-status"
import { useRouter } from "next/navigation"
import { LinkExternal } from "@/components/ui/link-external"
import { fmOAuthForAuthCodeUrl } from "@/lib/oauth"
import { dialog } from "@/app/home/components/config"

export function SigninButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { isLoading, isSignedIn } = useGetSigninStatus(["signinButton"])

  return (
    <>
      <Button
        disabled={isLoading}
        color="orange"
        type="button"
        onClick={() => {
          if (isSignedIn) {
            router.push("/dashboard")
          } else {
            setIsOpen(true)
          }
        }}
      >
        <span className={className}>{text}</span>
      </Button>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>{dialog.title}</DialogTitle>
        <DialogDescription>
          {dialog.description_normal}{" "}
          <span className="underline underline-offset-4 decoration-2 decoration-wavy decoration-orange-400">
            {dialog.description_underlined}
          </span>
        </DialogDescription>
        <DialogActions>
          <Button plain onClick={() => setIsOpen(false)}>
            {dialog.cancel}
          </Button>

          <Button color="orange">
            <LinkExternal href={fmOAuthForAuthCodeUrl} openInNewTab={false}>
              <span className={className}>{dialog.continue}</span>
            </LinkExternal>
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
