import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://roknldhxjuptykzekzgx.supabase.co';
const supabaseKey = 'sb_publishable_2Hg2U062NY0NkyBnFVrDsA_1dX1z-Wh';
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getUserCode() {
  let usercode = localStorage.getItem('kimai_usercode');
  if (!usercode) {
    try {
      // Generate code from 0001
      const { data, count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error("Supabase count error:", error);
      }
      
      const nextId = (count || 0) + 1;
      usercode = nextId.toString().padStart(4, '0');
      localStorage.setItem('kimai_usercode', usercode);
    } catch (e) {
      console.error(e);
      usercode = "0001";
      localStorage.setItem('kimai_usercode', usercode);
    }
  }
  return usercode;
}

export async function submitMessage(content: string) {
  const usercode = await getUserCode();
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { usercode, content }
    ]);
  if (error) {
    console.error("Supabase Error:", error);
    throw new Error(error.message || 'Insert Failed');
  }
  return data;
}

export async function getMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, created_at, usercode, content')
    .order('created_at', { ascending: false });
  if (error) {
    console.error("Supabase Error:", error);
    throw new Error(error.message || 'Fetch Failed');
  }
  return data;
}
