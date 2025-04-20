import { Button } from '@/components/ui/button'

export default function SignoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <Button variant="outline" size="sm" type="submit">
        Sign out
      </Button>
    </form>
  )
}
