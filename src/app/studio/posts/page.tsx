import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostsManager from "./posts-manager";

export const metadata = {
  title: "Posts Studio | Momentrix",
};

export default async function PostsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "PHOTOGRAPHER") {
    redirect("/login?callbackUrl=/studio/posts");
  }

  const profile = await prisma.photographerProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          mediaUrls: true,
          likes: true,
          saves: true,
          enquiries: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) {
    redirect("/onboarding/photographer");
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12 text-slate-100">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="chip w-fit">Creator studio</p>
          <h1 className="text-3xl font-semibold text-white">Publish posts & reels</h1>
          <p className="text-sm text-slate-300">
            Share behind-the-scenes stories, reels, and carousels to keep leads engaged.
          </p>
        </div>
      </header>
      <PostsManager
        profileId={profile.id}
        initialPosts={profile.posts.map((post) => ({
          ...post,
          mediaUrls: (post.mediaUrls as string[] | null) ?? [],
          createdAt: post.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

