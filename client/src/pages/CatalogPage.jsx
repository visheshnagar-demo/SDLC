import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tracksApi } from "../services/api";
import TrackCard from "../components/catalog/TrackCard";
import FilterBar from "../components/catalog/FilterBar";
import { Sparkles, Loader2 } from "lucide-react";

const DEFAULT_TRACKS = [
  {
    id: "1",
    title: "Mathematics for Machine Learning",
    slug: "mathematics-for-machine-learning",
    description:
      "Master linear algebra, multivariate calculus, optimization gradients, and probability theory essentials for AI models.",
    difficulty: "Beginner",
    estimated_hours: 12,
    order_index: 1,
    is_published: true,
    tags: ["LinearAlgebra", "Calculus", "Probability"],
  },
  {
    id: "2",
    title: "Supervised Learning Mastery",
    slug: "supervised-learning-mastery",
    description:
      "From linear regression and loss landscapes to decision trees, support vector machines, and ensemble methods.",
    difficulty: "Beginner",
    estimated_hours: 16,
    order_index: 2,
    is_published: true,
    tags: ["Regression", "DecisionTrees", "SVM"],
  },
  {
    id: "3",
    title: "Deep Learning & Neural Architectures",
    slug: "deep-learning-and-neural-architectures",
    description:
      "Understand feedforward nets, backpropagation, convolutional networks, residual connections, and recurrent models.",
    difficulty: "Intermediate",
    estimated_hours: 24,
    order_index: 3,
    is_published: true,
    tags: ["PyTorch", "CNN", "Backprop"],
  },
  {
    id: "4",
    title: "Natural Language Processing & Transformers",
    slug: "nlp-and-transformers",
    description:
      "Explore word embeddings, sequence-to-sequence attention, BERT, GPT self-attention, and modern Large Language Models.",
    difficulty: "Advanced",
    estimated_hours: 28,
    order_index: 4,
    is_published: true,
    tags: ["Transformers", "Attention", "LLMs"],
  },
  {
    id: "5",
    title: "Computer Vision & Diffusion Models",
    slug: "computer-vision-and-diffusion",
    description:
      "Object detection with YOLO, image segmentation, generative adversarial networks, and latent diffusion architectures.",
    difficulty: "Advanced",
    estimated_hours: 20,
    order_index: 5,
    is_published: true,
    tags: ["Vision", "Diffusion", "GANs"],
  },
  {
    id: "6",
    title: "MLOps: Production Engineering & Deployment",
    slug: "mlops-production-engineering",
    description:
      "Model containerization, feature stores, experiment tracking with MLflow, continuous evaluation, and scalable inference.",
    difficulty: "Intermediate",
    estimated_hours: 18,
    order_index: 6,
    is_published: true,
    tags: ["Docker", "MLflow", "FastAPI"],
  },
];

export const CatalogPage = () => {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchTracks = async () => {
      setLoading(true);
      try {
        const data = await tracksApi.getTracks();
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        } else {
          setTracks(DEFAULT_TRACKS);
        }
      } catch {
        setTracks(DEFAULT_TRACKS);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, []);

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      !searchQuery ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.tags &&
        track.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    const matchesDiff =
      !selectedDifficulty ||
      track.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    const matchesCat =
      !selectedCategory ||
      track.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (track.tags &&
        track.tags.some((t) =>
          t.toLowerCase().includes(selectedCategory.toLowerCase()),
        ));

    return matchesSearch && matchesDiff && matchesCat;
  });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Header Banner */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
          <Sparkles size={14} />
          <span>CURATED AI/ML LEARNING PATHS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Master AI & Machine Learning
        </h1>
        <p className="text-slate-400 mt-2.5 text-sm sm:text-base max-w-3xl leading-relaxed">
          Structured paths from foundational mathematical derivations to deep
          learning architectures, transformer attention mechanisms, and
          production-grade MLOps pipelines.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        totalCount={filteredTracks.length}
      />

      {/* Tracks Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Loading AI/ML tracks...</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="py-16 text-center border border-slate-800 bg-[#1E293B]/40 rounded-2xl">
          <p className="text-base font-bold text-slate-300">
            No matching tracks found
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <TrackCard
              key={track.id || track.slug}
              track={track}
              onStart={() => navigate(`/tracks/${track.slug || track.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default CatalogPage;
