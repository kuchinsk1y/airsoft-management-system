import AdminLayout from '../components/AdminLayout'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayout>{children}</AdminLayout>
  )
}
