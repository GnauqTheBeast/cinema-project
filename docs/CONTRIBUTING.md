# Contributing to Cinema Booking System

Thank you for your interest in contributing to the Cinema Booking System! We welcome contributions from the community.

---

## Table of Contents

- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

---

## How to Contribute

### 1. Fork the Repository

```bash
# Click the "Fork" button on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/cinema-project.git
cd cinema-project
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Your Changes

- Write clean, readable code following existing patterns
- Add comments for complex logic
- Update documentation if needed
- Write tests for new features

### 4. Test Your Changes

```bash
# Run the entire system
docker compose up -d --build

# Test specific services
cd movie-service
go test ./...

# Test frontend
cd FE
npm test
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add movie recommendation feature"
# or
git commit -m "fix: resolve seat double-booking issue"
```

**Commit Message Format**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks
- `perf:` Performance improvements
- `style:` Code style changes (formatting, etc.)

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub with a clear description of your changes.

---

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Go 1.21+
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/cinema-project.git
cd cinema-project

# Start infrastructure (PostgreSQL, Redis)
docker compose up -d postgres redis

# Run a service locally (example: Movie Service)
cd movie-service
cp .env.example .env
# Edit .env with your configuration
go run main.go

# Run frontend
cd FE
npm install
npm start
```

---

## Code Style Guidelines

### Go Services

- Follow [Effective Go](https://go.dev/doc/effective_go) principles
- Use `gofmt` for formatting
- Run `golint` before committing
- Keep functions small and focused
- Write meaningful variable and function names
- Add comments for exported functions

**Example**:
```go
// GetMovieByID retrieves a movie by its ID from the database
func (s *MovieService) GetMovieByID(ctx context.Context, id int) (*Movie, error) {
    var movie Movie
    err := s.db.NewSelect().
        Model(&movie).
        Where("id = ?", id).
        Scan(ctx)
    if err != nil {
        return nil, fmt.Errorf("failed to get movie: %w", err)
    }
    return &movie, nil
}
```

### Node.js/TypeScript Services

- Use TypeScript for type safety
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint and Prettier
- Prefer async/await over callbacks
- Use meaningful variable names
- Add JSDoc comments for functions

**Example**:
```typescript
/**
 * Authenticates a user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns JWT token and user information
 */
async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  const token = generateJWT(user);
  return { token, user };
}
```

### React Frontend

- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components small and reusable
- Use meaningful component and prop names
- Add PropTypes or TypeScript types

**Example**:
```jsx
import React, { useState, useEffect } from 'react';

const MovieCard = ({ movie, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="movie-card bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(movie)}
    >
      <img src={movie.poster_url} alt={movie.title} className="w-full h-48 object-cover rounded" />
      <h3 className="text-lg font-bold mt-2">{movie.title}</h3>
      <p className="text-gray-600 text-sm">{movie.duration} min</p>
    </div>
  );
};

export default MovieCard;
```

### Database Migrations

- Use descriptive migration names
- Include both up and down migrations
- Test migrations before committing
- Never modify existing migrations

**Example**:
```sql
-- 001_create_movies.sql
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    release_date DATE,
    poster_url VARCHAR(500),
    rating DECIMAL(3, 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_release_date ON movies(release_date);
```

---

## Pull Request Process

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive
- [ ] No merge conflicts with main branch
- [ ] PR description clearly explains the changes

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of specific changes
- Another change
- etc.

## Testing
How has this been tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Fixes #123
```

### Review Process

1. Submit your PR
2. Wait for automated checks to pass
3. Address reviewer feedback
4. Once approved, a maintainer will merge your PR

---

## Reporting Issues

Found a bug or have a feature request? Please open an issue with:

### Bug Report Template

```markdown
**Bug Description**
A clear and concise description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Docker version: [e.g., 20.10.21]
- Browser: [e.g., Chrome 120]

**Screenshots**
If applicable, add screenshots

**Additional Context**
Any other relevant information
```

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Any other relevant information
```

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

**Positive behavior includes**:
- Being respectful and inclusive
- Providing constructive feedback
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes**:
- Harassment or discriminatory language
- Personal attacks
- Publishing others' private information
- Other unprofessional conduct

### Enforcement

Violations of the code of conduct may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: conduct@cinema-project.com

---

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes

### Release Process

1. Create release branch from `develop`
2. Update version numbers
3. Update CHANGELOG.md
4. Merge to `main` and tag release
5. Merge back to `develop`

---

## Testing Guidelines

### Unit Tests

```bash
# Go services
cd service-name
go test ./...

# Node.js services
cd service-name
npm test
```

### Integration Tests

```bash
# Start all services
docker compose up -d

# Run integration tests
npm run test:integration
```

### Manual Testing

- Test all affected features
- Verify no regressions
- Check error handling
- Test edge cases

---

## Getting Help

- **Documentation**: Check the [docs](../docs) folder
- **Discussions**: Use [GitHub Discussions](https://github.com/yourusername/cinema-project/discussions)
- **Chat**: Join our [Discord server](https://discord.gg/cinema-project)

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project website (future)

Thank you for contributing! 🎉
