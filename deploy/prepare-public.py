#!/usr/bin/env python3
"""Export a new, history-free code snapshot. Never overwrites an existing path."""
import argparse
import re
import shutil
from pathlib import Path


ROOT_FILES = (
    'README.md', 'THIRD_PARTY_NOTICES.md', '.gitignore', '.dockerignore', 'Dockerfile', 'docker-compose.yml',
    '.github/workflows/ci.yml', '.github/workflows/deploy.yml',
    'deploy/DEPLOY.md', 'deploy/PUBLIC_README.md', 'deploy/compose.yml', 'deploy/production.env.example',
    'deploy/deploy.sh', 'deploy/deploy.test.sh', 'deploy/prepare-public.py', 'deploy/prepare-public.test.py',
)
EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', '.store', '.cache', '__pycache__'}
PET_ID = re.compile(r'\bpet_[a-f0-9]{12}\b')
SLACK_USER_ID = re.compile(r'\bU[A-Z0-9]{8,}\b')
STRING = r'''['"]([^'"\n]+)['"]'''
NAME = re.compile(r'''\b(?:name|playerName|ownerName)\s*[:=]\s*''' + STRING)
USER_OBJECT = re.compile(r'\{[^{}]*\b(?:userId|user_id)\s*:[^{}]*\}')
DEMO_PERSON = re.compile(r'Demo Colleague \d{3} 示例同事')


def fixture(path: Path) -> bool:
    return path.parts[:2] == ('web', 'src') and (
        path.name.endswith('.gallery.tsx') or path.as_posix() == 'web/src/dev/prepPets.ts'
    )


def replacements(texts: dict[Path, str]) -> tuple[dict[str, str], dict[str, str]]:
    """Derive private fixture values at export time; never embed their mapping in the snapshot."""
    fixtures = [text for path, text in sorted(texts.items()) if fixture(path)]
    pet_ids = sorted({value for text in fixtures for value in PET_ID.findall(text)})
    pet_values = {value: f'pet_demo_{index:03d}' for index, value in enumerate(pet_ids, 1)}
    pet_names: dict[str, str] = {}

    def add_pet(pet_id: str, name: str) -> None:
        if pet_id in pet_values:
            pet_names.setdefault(name, f'Example Pet {pet_values[pet_id].rsplit("_", 1)[1]}')

    for text in fixtures:
        for match in re.finditer(r'''\[\s*['"](pet_[a-f0-9]{12})['"]\s*,\s*''' + STRING + r'\s*\]', text):
            add_pet(match[1], match[2])
        ids = re.search(r'\bconst ids\s*=\s*\[([^\]]+)\]', text)
        names = re.search(r'\bconst names\s*=\s*\[([^\]]+)\]', text)
        if ids and names:
            values = re.findall(STRING, ids[1])
            labels = re.findall(STRING, names[1])
            if len(values) != len(labels):
                raise ValueError('fixture pet ID/name arrays differ in length; review before exporting')
            for pet_id, name in zip(values, labels):
                add_pet(pet_id, name)
    # A few gallery cards use an inline name beside a real image URL.
    for text in fixtures:
        for match in re.finditer(r'''\bname\s*:\s*''' + STRING + r'''[^{}\n]{0,120}/img/(?:pets|silhouettes)/(pet_[a-f0-9]{12})''', text):
            add_pet(match[2], match[1])

    full_names: set[str] = set()
    actual_user_ids: set[str] = set()
    private_roots: set[str] = set()
    for text in fixtures:
        actual_user_ids.update(SLACK_USER_ID.findall(text))
        for user in USER_OBJECT.findall(text):
            match = NAME.search(user)
            if match and not DEMO_PERSON.fullmatch(match[1]) and SLACK_USER_ID.search(user):
                full_names.add(match[1])
                if SLACK_USER_ID.search(user):
                    private_roots.add(match[1].split()[0])
    # Keep an ordinary first-name contact in product copy; replace only full display names.
    for text in texts.values():
        for match in NAME.finditer(text):
            name = match[1]
            if any(name.startswith(root + ' ') for root in private_roots):
                full_names.add(name)
    roots = sorted({name.split()[0] for name in full_names})
    person_values = {
        name: f'Demo Colleague {roots.index(name.split()[0]) + 1:03d} 示例同事'
        for name in full_names
    }
    person_values.update({
        value: f'U_DEMO_{index:03d}'
        for index, value in enumerate(sorted(actual_user_ids), 1)
    })
    return {**pet_values, **pet_names}, person_values


def replace_values(text: str, values: dict[str, str]) -> str:
    if not values:
        return text
    alternatives = []
    for value in sorted(values, key=lambda v: (-len(v), v)):
        before = r'(?<![A-Za-z0-9_$])' if re.match(r'[A-Za-z0-9_$]', value[0]) else ''
        after = r'(?![A-Za-z0-9_$])' if re.match(r'[A-Za-z0-9_$]', value[-1]) else ''
        alternatives.append(before + re.escape(value) + after)
    pattern = re.compile('|'.join(alternatives))
    # Replace data inside string literals, never TypeScript identifiers or module paths.
    tokens = re.compile(
        r'''(?P<module>\b(?:from\s+|(?:import|require)\s*\(\s*|import\s+)['"][^'"\r\n]+['"])'''
        r'''|(?P<literal>'(?:\\.|[^'\\\r\n])*'|"(?:\\.|[^"\\\r\n])*"|`(?:\\.|[^`\\])*`)'''
    )
    return tokens.sub(
        lambda token: token[0] if token['module'] else pattern.sub(lambda match: values[match[0]], token[0]),
        text,
    )


def sanitize(path: Path, text: str, pets: dict[str, str], people: dict[str, str]) -> str:
    if path.as_posix() == 'server/scripts/supabase-verify.ts':
        text, count = re.subn(
            r'''const SMOKE_PLAYER = ['"][^'"\n]+['"];''',
            "const SMOKE_PLAYER = process.env.PET_MATCH_SMOKE_PLAYER;\n"
            "if (!SMOKE_PLAYER?.trim()) throw new Error('PET_MATCH_SMOKE_PLAYER missing');",
            text,
        )
        if count != 1 and not (
            'const SMOKE_PLAYER = process.env.PET_MATCH_SMOKE_PLAYER;' in text
            and "if (!SMOKE_PLAYER?.trim()) throw new Error('PET_MATCH_SMOKE_PLAYER missing');" in text
        ):
            raise ValueError('smoke-player declaration changed; review before exporting')
    if fixture(path):
        # Names occasionally also appear as a local fixture variable, not only a label.
        for match in re.finditer(r'\bconst\s+(\w+)(?:\s*:[^=;\n]+)?\s*=\s*\{[^{}]*?\bname\s*:\s*' + STRING, text):
            variable, name = match[1], match[2]
            if variable.casefold() == name.casefold() and name in pets:
                demo_variable = 'demoPet' + pets[name].rsplit(' ', 1)[1]
                text = re.sub(r'\b' + re.escape(variable) + r'\b', demo_variable, text)
        text = replace_values(text, pets)
        text = re.sub(
            r'''\bquote:\s*['"][^'"\n]*['"]''',
            "quote: '这是一段虚构的宠物介绍，用于展示长文案的排版、换行与卡片状态。'",
            text,
        )
    return replace_values(text, people)


def allowed(path: Path) -> bool:
    return not (
        any(part in EXCLUDED_DIRS for part in path.parts)
        or path.name == '.DS_Store'
        or path.name == '.env'
        or path.name.startswith('.env.')
        or '.env.' in path.name
        or path.name.endswith(('.env', '.tsbuildinfo', '.pyc'))
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path, help='new directory outside the source project')
    args = parser.parse_args()
    source = Path(__file__).resolve().parent.parent
    destination = args.destination.expanduser().resolve()
    if destination == source or source in destination.parents or destination.exists():
        parser.error('destination must be a new directory outside the source project')
    files = [source / name for name in ROOT_FILES]
    for directory in ('web', 'server'):
        for path in (source / directory).rglob('*'):
            if path.is_file() and allowed(path.relative_to(source)):
                files.append(path)
    for path in files:
        if not path.is_file() or path.is_symlink():
            parser.error(f'missing file or unsupported symlink: {path.relative_to(source)}')
    texts = {
        path.relative_to(source): path.read_text()
        for path in files if path.suffix in {'.ts', '.tsx'}
    }
    pets, people = replacements(texts)
    prepared = {path: sanitize(path, text, pets, people) for path, text in texts.items()}
    sanitized = sum(prepared[path] != text for path, text in texts.items())
    destination.mkdir(parents=True)
    total = 0
    for path in sorted(files):
        output = destination / path.relative_to(source)
        output.parent.mkdir(parents=True, exist_ok=True)
        relative = path.relative_to(source)
        copy_source = source / 'deploy/PUBLIC_README.md' if relative.as_posix() == 'README.md' else path
        shutil.copy2(copy_source, output)
        if relative in prepared and prepared[relative] != texts[relative]:
            output.write_text(prepared[relative])
        total += output.stat().st_size
    print(f'Prepared {len(files)} files ({total / 1024 / 1024:.1f} MiB) at {destination}')
    print(f'Sanitized private fixture values in {sanitized} source files; source project unchanged.')
    print('Excluded git history, environment files, private materials and local dependencies.')
    print('Organization identifiers and MoeGo branding remain; review their inclusion before publishing.')
    print('Review this snapshot before creating its first commit or pushing to GitHub.')


if __name__ == '__main__':
    main()
