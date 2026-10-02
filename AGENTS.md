# Project instructions

See `README.md` for purpose and design.

- Check: `uv run --with pytest --with requests python -m pytest`, `uvx ruff check`,
  `uvx ruff format --check`.
- Running `daily_leetcode.py` posts to Discord. Tests and imports don't; never run
  `main()` without being asked.
- Keep it stateless: nothing is written back to the repo.
- Dependencies live in the script's PEP 723 header; don't add requirements files.
