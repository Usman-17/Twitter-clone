import { useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Bookmark, Heart, MessageCircle, Repeat2, Trash } from "lucide-react";

import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// Imports End

const Post = ({ post }) => {
  const [comment, setComment] = useState("");

  const queryClient = useQueryClient();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const postOwner = post.user;
  const isMyPost = authUser._id === post.user._id;
  const isLiked = post.likes.includes(authUser._id);
  const formattedDate = formatPostDate(post.createdAt);

  // Mutation to delete a post
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: "DELETE",
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete post");
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Mutation to like a post
  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/like/${post._id}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Mutation to comment a post
  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },

    onSuccess: () => {
      setComment("");
      toast.success("Comment added successfully");
      // invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handleLikePost = () => {
    if (isLiking) return;
    likePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  return (
    <>
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        {/* Profile Img */}
        <div className="avatar">
          <Link
            to={`/profile/${postOwner.username}`}
            className="w-8 rounded-full overflow-hidden"
          >
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
          </Link>
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            {/* User Name */}
            <Link
              to={`/profile/${postOwner.username}`}
              className="font-bold text-sm lg:text-base"
            >
              {postOwner.fullName}
            </Link>

            <span className="text-gray-700 gap-1 text-sm hidden lg:flex">
              <Link to={`/profile/${postOwner.username}`}>
                @{postOwner.username}
              </Link>

              <span>·</span>

              <span>{formattedDate}</span>
            </span>

            {/* Delete Post */}
            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <Trash
                    onClick={handleDeletePost}
                    className="cursor-pointer hover:text-red-500"
                    size={22}
                  />
                )}

                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-5 overflow-hidden text-sm lg:text-base">
            <span>{post.text}</span>

            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt="img"
              />
            )}
          </div>

          {/* Comments */}
          <div className="flex justify-between mt-3">
            <div className="flex gap-4 items-center w-2/3 justify-between">
              <div
                className="flex gap-1 items-center cursor-pointer group"
                onClick={() =>
                  document
                    .getElementById("comments_modal" + post._id)
                    .showModal()
                }
              >
                <MessageCircle
                  size={32}
                  className="w-4 h-4  text-slate-500 group-hover:text-sky-400"
                />

                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {post.comments.length}
                </span>
              </div>

              {/* We're using Modal Component from DaisyUI */}
              <dialog
                id={`comments_modal${post._id}`}
                className="modal border-none outline-none"
              >
                <div className="modal-box rounded border border-gray-600">
                  <h3 className="font-bold text-lg mb-4">COMMENTS</h3>

                  <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                    {post.comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}

                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img
                              src={
                                comment.user.profileImg ||
                                "/avatar-placeholder.png"
                              }
                            />
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">
                              {comment.user.fullName}
                            </span>

                            <span className="text-gray-700 text-sm hidden md:flex">
                              @{comment.user.username}
                            </span>
                          </div>

                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />

                    <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                      {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                    </button>
                  </form>
                </div>

                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>

              {/* Repost */}
              <div className="flex gap-1 items-center group cursor-pointer">
                <Repeat2 className="w-6 h-6  text-slate-500 group-hover:text-green-500" />
                <span className="text-sm text-slate-500 group-hover:text-green-500">
                  0
                </span>
              </div>

              {/* Like */}
              <div
                className="flex gap-1 items-center group cursor-pointer"
                onClick={handleLikePost}
              >
                {isLiking && <LoadingSpinner size="sm" />}

                {!isLiked && !isLiking && (
                  <Heart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                )}

                {isLiked && !isLiking && (
                  <Heart
                    size={24}
                    className="w-4 h-4 cursor-pointer text-pink-500 "
                  />
                )}

                <span
                  className={`text-sm  group-hover:text-pink-500 ${
                    isLiked ? "text-pink-500" : "text-slate-500"
                  }`}
                >
                  {post.likes.length}
                </span>
              </div>
            </div>

            {/* BookMark */}
            <div className="flex w-1/3 justify-end gap-2 items-center">
              <Bookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Post;
