// "use client"
import React from 'react'
import { useSession } from "@/context/SessionContext";
import Loader from '@/components/loader';
import { Profil } from '@/components/main/profil';
import { getUser } from '@/actions/getUser';
import { redirect } from 'next/navigation';

// Page liée à la session (cookies) : jamais pré-générée au build
export const dynamic = 'force-dynamic';

const page = 
async () => {
// () => {
  // const { user, isAuthenticated } = useSession();
  const user = await getUser();
  if (!user?.user?.user) {
    redirect('/auth/login');
  }
  // console.log('=========================');
  // console.log(user);
  // console.log('=========================');

  

  return (
    <div>  
      {/* {
        JSON.stringify(user)
      }
      <Loader fullScreen={true} /> */}
      <Profil user={user.user.user}/>
    </div>
  )
}

export default page