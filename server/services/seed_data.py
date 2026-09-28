from sqlalchemy.orm import Session
from server.core.security import get_password_hash
from server.models.user import User
from server.models.track import Track
from server.models.module import Module
from server.models.tutorial import Tutorial
from server.models.quiz import Quiz, QuizQuestion


def seed_initial_data(db: Session) -> None:
    # 1. Seed Users
    users_data = [
        {
            "email": "test@example.com",
            "password": "testpassword",
            "full_name": "Test Learner",
            "role": "learner",
            "is_active": True,
        },
        {
            "email": "admin@example.com",
            "password": "adminpassword",
            "full_name": "Admin Instructor",
            "role": "admin",
            "is_active": True,
        },
    ]

    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=u["is_active"],
            )
            db.add(user)
    try:
        db.commit()
    except Exception:
        db.rollback()

    # 2. Seed Tracks & Curriculum
    tracks_seed = [
        {
            "title": "Mathematics for Machine Learning",
            "slug": "math-for-ml",
            "description": "Foundational linear algebra, vector calculus, matrix decompositions, and probability theory essential for machine learning.",
            "difficulty": "Beginner",
            "estimated_hours": 12,
            "prerequisites": "Basic High School Algebra",
            "order_index": 1,
            "is_published": True,
            "modules": [
                {
                    "title": "Linear Algebra & Vector Spaces",
                    "slug": "linear-algebra-vectors",
                    "summary": "Vectors, matrices, dot products, eigenvalues, and eigenvectors.",
                    "difficulty": "Beginner",
                    "estimated_minutes": 45,
                    "prerequisites": "Basic scalar arithmetic",
                    "order_index": 1,
                    "tutorials": [
                        {
                            "title": "Vectors, Dot Products & Norms",
                            "slug": "vectors-and-dot-products",
                            "content_markdown": "# Vectors, Dot Products & Norms\n\nVectors are the fundamental building blocks of machine learning datasets and models. An n-dimensional vector represents a point or direction in space.\n\n### The Dot Product\nThe dot product of two vectors $u$ and $v$ measures directional alignment and geometric projection.\n\n```python\nimport numpy as np\n\nu = np.array([1.0, 2.0, 3.0])\nv = np.array([4.0, -1.0, 2.0])\n\ndot_product = np.dot(u, v)\nprint(f'Dot product: {dot_product}')\n```",
                            "math_formulas": "u \\cdot v = \\sum_{i=1}^{n} u_i v_i = \\|u\\| \\|v\\| \\cos(\\theta)",
                            "code_snippets": [
                                {
                                    "language": "python",
                                    "title": "NumPy Vector Dot Product",
                                    "code": "import numpy as np\n\nu = np.array([1.0, 2.0, 3.0])\nv = np.array([4.0, -1.0, 2.0])\ndot = np.dot(u, v)\nprint(f'Dot product: {dot}')",
                                }
                            ],
                            "tags": "math,linear-algebra,numpy,vectors",
                            "order_index": 1,
                        },
                        {
                            "title": "Matrix Multiplication & Transformations",
                            "slug": "matrix-multiplication-transformations",
                            "content_markdown": "# Matrix Multiplication & Linear Transformations\n\nMatrices represent linear transformations of coordinate spaces. In neural networks, weight layers perform linear mappings via matrix-vector products.",
                            "math_formulas": "Y = X W + b",
                            "code_snippets": [
                                {
                                    "language": "python",
                                    "title": "Matrix Multiplication in NumPy",
                                    "code": "import numpy as np\n\nX = np.random.randn(32, 10)  # batch of 32 samples\nW = np.random.randn(10, 5)   # weight matrix\nY = np.matmul(X, W)\nprint(f'Transformed shape: {Y.shape}')",
                                }
                            ],
                            "tags": "math,linear-algebra,matrices,numpy",
                            "order_index": 2,
                        },
                    ],
                    "quiz": {
                        "title": "Linear Algebra Basics Quiz",
                        "passing_score": 70,
                        "questions": [
                            {
                                "question_text": "What does a dot product of zero between two non-zero vectors indicate?",
                                "options": [
                                    {
                                        "id": "a",
                                        "text": "The vectors are orthogonal (perpendicular)",
                                    },
                                    {"id": "b", "text": "The vectors are parallel"},
                                    {
                                        "id": "c",
                                        "text": "The vectors have identical lengths",
                                    },
                                    {
                                        "id": "d",
                                        "text": "The vectors are linearly dependent",
                                    },
                                ],
                                "correct_answer": "a",
                                "explanation": "The dot product is proportional to cos(θ). cos(90°) = 0, meaning orthogonal vectors have a dot product of 0.",
                                "order_index": 1,
                            },
                            {
                                "question_text": "Given matrix A with shape (3, 4) and matrix B with shape (4, 2), what is the shape of AB?",
                                "options": [
                                    {"id": "a", "text": "(4, 4)"},
                                    {"id": "b", "text": "(3, 2)"},
                                    {"id": "c", "text": "(2, 3)"},
                                    {"id": "d", "text": "(3, 4)"},
                                ],
                                "correct_answer": "b",
                                "explanation": "For matrix multiplication (M, K) × (K, N), the resulting matrix has dimensions (M, N), yielding (3, 2).",
                                "order_index": 2,
                            },
                        ],
                    },
                }
            ],
        },
        {
            "title": "Supervised Learning Mastery",
            "slug": "supervised-learning",
            "description": "Master classification and regression algorithms including Linear Regression, Decision Trees, SVMs, and Gradient Boosting.",
            "difficulty": "Intermediate",
            "estimated_hours": 18,
            "prerequisites": "Mathematics for Machine Learning, Python Basics",
            "order_index": 2,
            "is_published": True,
            "modules": [
                {
                    "title": "Gradient Descent & Optimization",
                    "slug": "gradient-descent-optimization",
                    "summary": "First-order optimization techniques, loss functions, learning rate schedules, and convergence properties.",
                    "difficulty": "Beginner",
                    "estimated_minutes": 40,
                    "prerequisites": "Vector Calculus & Dot Products",
                    "order_index": 1,
                    "tutorials": [
                        {
                            "title": "Gradient Descent Optimization",
                            "slug": "gradient-descent-tutorial",
                            "content_markdown": "# Gradient Descent Optimization\n\nGradient descent is a first-order iterative optimization algorithm for finding a local minimum of a differentiable loss function.\n\n### Mathematical Formulation\n$$\nw_{t+1} = w_t - \\eta \\nabla L(w_t)\n$$\n\nWhere $\\eta$ is the learning rate parameter controlling step magnitude.\n\n### Python Implementation\n\n```python\nimport numpy as np\n\ndef gradient_descent(X, y, lr=0.01, epochs=1000):\n    m, n = X.shape\n    weights = np.zeros(n)\n    bias = 0.0\n    for epoch in range(epochs):\n        y_pred = np.dot(X, weights) + bias\n        dw = (1 / m) * np.dot(X.T, (y_pred - y))\n        db = (1 / m) * np.sum(y_pred - y)\n        weights -= lr * dw\n        bias -= lr * db\n    return weights, bias\n```",
                            "math_formulas": "w_{t+1} = w_t - \\eta \\nabla L(w_t)",
                            "code_snippets": [
                                {
                                    "language": "python",
                                    "title": "Vectorized Gradient Descent",
                                    "code": "import numpy as np\n\ndef gradient_descent(X, y, lr=0.01, epochs=1000):\n    m, n = X.shape\n    weights = np.zeros(n)\n    bias = 0.0\n    for epoch in range(epochs):\n        y_pred = np.dot(X, weights) + bias\n        dw = (1 / m) * np.dot(X.T, (y_pred - y))\n        db = (1 / m) * np.sum(y_pred - y)\n        weights -= lr * dw\n        bias -= lr * db\n    return weights, bias",
                                }
                            ],
                            "tags": "supervised-learning,optimization,gradient-descent,numpy,scikit-learn",
                            "order_index": 1,
                        }
                    ],
                    "quiz": {
                        "title": "Quiz: Gradient Descent & Optimization",
                        "passing_score": 70,
                        "questions": [
                            {
                                "question_text": "In standard Batch Gradient Descent, what occurs when the learning rate (η) is chosen to be excessively large?",
                                "options": [
                                    {
                                        "id": "a",
                                        "text": "The algorithm converges monotonically to the global minimum.",
                                    },
                                    {
                                        "id": "b",
                                        "text": "The optimization oscillates wildly across the loss valley and may diverge.",
                                    },
                                    {
                                        "id": "c",
                                        "text": "The weight updates become infinitesimally small.",
                                    },
                                    {
                                        "id": "d",
                                        "text": "The loss function switches to second-order optimization.",
                                    },
                                ],
                                "correct_answer": "b",
                                "explanation": "Large step sizes overshoot valleys, causing gradient updates to blow up and diverge.",
                                "order_index": 1,
                            },
                            {
                                "question_text": "What is the primary computational benefit of Stochastic Gradient Descent (SGD) over Batch Gradient Descent?",
                                "options": [
                                    {
                                        "id": "a",
                                        "text": "Faster parameter update frequency using single samples or mini-batches.",
                                    },
                                    {
                                        "id": "b",
                                        "text": "Guaranteed convergence to the exact global minimum in one step.",
                                    },
                                    {
                                        "id": "c",
                                        "text": "Elimination of learning rate hyperparameter.",
                                    },
                                    {
                                        "id": "d",
                                        "text": "Zero variance in gradient approximations.",
                                    },
                                ],
                                "correct_answer": "a",
                                "explanation": "SGD updates parameters after each sample or mini-batch, drastically accelerating training on large datasets.",
                                "order_index": 2,
                            },
                        ],
                    },
                }
            ],
        },
        {
            "title": "Deep Learning & Neural Networks",
            "slug": "deep-learning",
            "description": "Explore multilayer perceptrons, convolutional networks for computer vision, recurrent networks, and transformer attention mechanisms.",
            "difficulty": "Advanced",
            "estimated_hours": 24,
            "prerequisites": "Supervised Learning, Matrix Calculus, PyTorch Basics",
            "order_index": 3,
            "is_published": True,
            "modules": [
                {
                    "title": "Transformers & Self-Attention",
                    "slug": "transformers-self-attention",
                    "summary": "Scaled dot-product attention, multi-head attention, positional encodings, and encoder-decoder architecture.",
                    "difficulty": "Advanced",
                    "estimated_minutes": 60,
                    "prerequisites": "Matrix Multiplication & Neural Networks",
                    "order_index": 1,
                    "tutorials": [
                        {
                            "title": "Self-Attention Mechanism & Tensors",
                            "slug": "self-attention-mechanism",
                            "content_markdown": "# Self-Attention Mechanism\n\nThe self-attention mechanism enables sequence models to dynamically weigh relationships between all token positions in parallel.\n\n### Attention Formula\n$$\n\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V\n$$\n\n### PyTorch Implementation\n\n```python\nimport torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    d_k = Q.size(-1)\n    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    weights = F.softmax(scores, dim=-1)\n    return torch.matmul(weights, V), weights\n```",
                            "math_formulas": "\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
                            "code_snippets": [
                                {
                                    "language": "python",
                                    "title": "Scaled Dot-Product Attention in PyTorch",
                                    "code": "import torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(Q, K, V):\n    d_k = Q.size(-1)\n    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)\n    weights = F.softmax(scores, dim=-1)\n    return torch.matmul(weights, V)",
                                }
                            ],
                            "tags": "deep-learning,nlp,transformers,pytorch,attention",
                            "order_index": 1,
                        }
                    ],
                    "quiz": {
                        "title": "Transformer Attention Quiz",
                        "passing_score": 70,
                        "questions": [
                            {
                                "question_text": "Why are attention scores divided by the square root of key dimension (√d_k)?",
                                "options": [
                                    {
                                        "id": "a",
                                        "text": "To prevent extremely small gradients during softmax when values become large",
                                    },
                                    {
                                        "id": "b",
                                        "text": "To enforce orthogonal key and query projections",
                                    },
                                    {
                                        "id": "c",
                                        "text": "To reduce matrix multiplication latency",
                                    },
                                    {
                                        "id": "d",
                                        "text": "To make the attention weights sum to zero",
                                    },
                                ],
                                "correct_answer": "a",
                                "explanation": "Without scaling, large dot products push the softmax function into regions with vanishingly small gradients.",
                                "order_index": 1,
                            }
                        ],
                    },
                }
            ],
        },
    ]

    for t_data in tracks_seed:
        track = db.query(Track).filter(Track.slug == t_data["slug"]).first()
        if not track:
            track = Track(
                title=t_data["title"],
                slug=t_data["slug"],
                description=t_data["description"],
                difficulty=t_data["difficulty"],
                estimated_hours=t_data["estimated_hours"],
                prerequisites=t_data.get("prerequisites", ""),
                order_index=t_data["order_index"],
                is_published=t_data["is_published"],
            )
            db.add(track)
            db.commit()
            db.refresh(track)
        else:
            if not track.prerequisites and t_data.get("prerequisites"):
                track.prerequisites = t_data.get("prerequisites")
                db.commit()

        for m_data in t_data.get("modules", []):
            module = db.query(Module).filter(Module.slug == m_data["slug"]).first()
            if not module:
                module = Module(
                    track_id=track.id,
                    title=m_data["title"],
                    slug=m_data["slug"],
                    summary=m_data["summary"],
                    difficulty=m_data["difficulty"],
                    estimated_minutes=m_data["estimated_minutes"],
                    prerequisites=m_data.get("prerequisites", ""),
                    order_index=m_data["order_index"],
                )
                db.add(module)
                db.commit()
                db.refresh(module)
            else:
                if not module.prerequisites and m_data.get("prerequisites"):
                    module.prerequisites = m_data.get("prerequisites")
                    db.commit()

            for tut_data in m_data.get("tutorials", []):
                tut = (
                    db.query(Tutorial).filter(Tutorial.slug == tut_data["slug"]).first()
                )
                if not tut:
                    tut = Tutorial(
                        module_id=module.id,
                        title=tut_data["title"],
                        slug=tut_data["slug"],
                        content_markdown=tut_data["content_markdown"],
                        math_formulas=tut_data.get("math_formulas"),
                        code_snippets=tut_data.get("code_snippets", []),
                        tags=tut_data.get("tags", ""),
                        order_index=tut_data["order_index"],
                    )
                    db.add(tut)
                    db.commit()

            q_data = m_data.get("quiz")
            if q_data:
                quiz = db.query(Quiz).filter(Quiz.module_id == module.id).first()
                if not quiz:
                    quiz = Quiz(
                        module_id=module.id,
                        title=q_data["title"],
                        passing_score=q_data.get("passing_score", 70),
                    )
                    db.add(quiz)
                    db.commit()
                    db.refresh(quiz)

                for q_item in q_data.get("questions", []):
                    existing_q = (
                        db.query(QuizQuestion)
                        .filter(
                            QuizQuestion.quiz_id == quiz.id,
                            QuizQuestion.order_index == q_item["order_index"],
                        )
                        .first()
                    )
                    if not existing_q:
                        qq = QuizQuestion(
                            quiz_id=quiz.id,
                            question_text=q_item["question_text"],
                            options=q_item["options"],
                            correct_answer=q_item["correct_answer"],
                            explanation=q_item["explanation"],
                            order_index=q_item["order_index"],
                        )
                        db.add(qq)
                        db.commit()
