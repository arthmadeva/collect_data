import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-8 dark:bg-black font-sans">
      <main className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 mb-6">
          My Todo List
        </h1>
        {todos && todos.length > 0 ? (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-all duration-200 hover:scale-[1.01]"
              >
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {todo.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No todos found. Add some in your Supabase dashboard!
          </p>
        )}
      </main>
    </div>
  );
}
