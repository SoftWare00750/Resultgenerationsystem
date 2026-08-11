diff --git a/result-generation-system/src/app/auth/admin/page.tsx b/result-generation-system/src/app/auth/admin/page.tsx
index fbffbe0..cc1c2c8 100644
--- a/result-generation-system/src/app/auth/admin/page.tsx
+++ b/result-generation-system/src/app/auth/admin/page.tsx
@@ -30,14 +30,14 @@ export default function AdminLoginPage() {
     setLoading(true);
     try {
       const user = await authService.login(email, password);
-      if (user.role !== "admin") {
+      if (user.role !== "admin" && user.role !== "central_admin") {
         toast.error("This portal is for administrators only.");
         await authService.logout();
         return;
       }
       setUser(user);
       toast.success(`Welcome back, ${user.name}!`);
-      router.push("/admin/dashboard");
+      router.push(user.role === "central_admin" ? "/central_admin/dashboard" : "/admin/dashboard");
     } catch (error: any) {
       toast.error(error.message || "Login failed");
     } finally {
diff --git a/result-generation-system/src/app/auth/login/page.tsx b/result-generation-system/src/app/auth/login/page.tsx
index e5780fd..782d340 100644
--- a/result-generation-system/src/app/auth/login/page.tsx
+++ b/result-generation-system/src/app/auth/login/page.tsx
@@ -31,6 +31,12 @@ export default function LoginPage() {
     setLoading(true);
     try {
       const user = await authService.login(email, password);
+      if (user.role === 'admin' || user.role === 'central_admin') {
+        await authService.logout();
+        toast.error('Admins must sign in through the Admin/School Owner/School Proprietor portal.');
+        router.push('/auth/admin');
+        return;
+      }
       setUser(user);
       toast.success(`Welcome back, ${user.name}!`);
       router.push(`/${user.role}/dashboard`);