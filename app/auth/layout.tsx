const AuthLayout = ({ 
    children
  }: { 
    children: React.ReactNode
  }) => {
    return ( 
      <div className="min-h-full flex items-center justify-center px-4 py-8 sm:px-6">
      {/* className="
      bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] 
      from-sky-400 to-blue-800"
      */}
        {children}
      </div>
     );
  }
   
  export default AuthLayout;