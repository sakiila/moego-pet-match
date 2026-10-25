#!/usr/bin/env python3
"""Check export transformations using invented identities, without writing a snapshot."""
import importlib.util
from pathlib import Path
import unittest


spec = importlib.util.spec_from_file_location('prepare_public', Path(__file__).with_name('prepare-public.py'))
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


class PublicFixtureTests(unittest.TestCase):
    def setUp(self):
        self.gallery = Path('web/src/components/Example/Example.gallery.tsx')
        self.prep = Path('web/src/dev/prepPets.ts')
        self.test = Path('server/__tests__/example.test.ts')
        self.runtime = Path('server/src/example.ts')
        self.verify = Path('server/scripts/supabase-verify.ts')
        self.texts = {
            self.gallery: """
const pets = [['pet_0123456789ab', 'Invented Pet']];
const player = { userId: 'U0123456789', name: 'Robin 示例原名' };
const other = { userId: 'U_TEST_SECOND', name: 'Jamie 示例名字' };
const alt = { userId: 'U_TEST_FIRST', name: 'Robin Example' };
const photo = '/img/pets/pet_0123456789ab/512';
const quote = { quote: 'A private pet biography.' };
""",
            self.prep: "const pets = [['pet_0123456789ab', 'Invented Pet']];",
            self.test: "expect(label).toBe('玩家：Robin 示例原名'); const player = { name: 'Robin Example' };",
            self.runtime: "const contact = 'Robin'; const team = 'T011CF3CMJN'; const pet = 'Invented Pet';",
            self.verify: "const SMOKE_PLAYER = 'U0123456789';\nregisterGame(tx, SMOKE_PLAYER, 'normal');",
        }

    def transform(self, texts):
        pets, people = exporter.replacements(texts)
        return {path: exporter.sanitize(path, text, pets, people) for path, text in texts.items()}

    def test_pet_names_ids_and_image_paths_stay_consistent(self):
        prepared = self.transform(self.texts)
        for path in (self.gallery, self.prep):
            self.assertIn("['pet_demo_001', 'Example Pet 001']", prepared[path])
            self.assertNotIn('pet_0123456789ab', prepared[path])
            self.assertNotIn('Invented Pet', prepared[path])
        self.assertIn('/img/pets/pet_demo_001/512', prepared[self.gallery])
        self.assertNotIn('A private pet biography.', prepared[self.gallery])

    def test_full_person_names_are_consistent_in_tests_and_fixtures(self):
        prepared = self.transform(self.texts)
        for text in prepared.values():
            self.assertNotIn('Robin 示例原名', text)
            self.assertNotIn('Robin Example', text)
        self.assertIn('Jamie 示例名字', prepared[self.gallery])
        self.assertIn('U_DEMO_001', prepared[self.gallery])
        pets, people = exporter.replacements(self.texts)
        self.assertEqual(people['Robin 示例原名'], people['Robin Example'])
        self.assertIn('玩家：' + people['Robin Example'], prepared[self.test])
        self.assertEqual(self.texts[self.runtime], prepared[self.runtime])

    def test_short_pet_name_does_not_change_identifiers_components_or_modules(self):
        texts = dict(self.texts)
        original_import = "import { TimeUpBanner, Ban } from './Ban';"
        texts[self.gallery] = original_import + """
const pets = [['pet_0123456789ab', 'Ban']];
const BanLocal = import('./Ban');
const module = require('./Ban');
const description = 'TimeUpBanner Banner BanLocal';
const element = <TimeUpBanner label="Ban" />;
"""
        prepared = self.transform(texts)[self.gallery]
        self.assertIn(original_import, prepared)
        self.assertIn("const BanLocal = import('./Ban');", prepared)
        self.assertIn("require('./Ban')", prepared)
        self.assertIn("'TimeUpBanner Banner BanLocal'", prepared)
        self.assertIn('<TimeUpBanner label="Example Pet 001" />', prepared)

    def test_smoke_player_requires_explicit_environment(self):
        prepared = self.transform(self.texts)[self.verify]
        self.assertIn('process.env.PET_MATCH_SMOKE_PLAYER', prepared)
        self.assertIn("if (!SMOKE_PLAYER?.trim()) throw new Error('PET_MATCH_SMOKE_PLAYER missing');", prepared)
        self.assertNotIn('U0123456789', prepared)

    def test_pet_name_used_as_variable_becomes_valid_demo_identifier(self):
        texts = dict(self.texts)
        texts[self.gallery] += "const inventedpet = { name: 'InventedPet', src: '/img/pets/pet_0123456789ab/512' }; use(inventedpet);"
        prepared = self.transform(texts)[self.gallery]
        self.assertIn('const demoPet001 =', prepared)
        self.assertIn('use(demoPet001)', prepared)
        self.assertNotIn('inventedpet', prepared)

    def test_unknown_smoke_declaration_fails_closed(self):
        with self.assertRaisesRegex(ValueError, 'smoke-player declaration changed'):
            exporter.sanitize(self.verify, 'const player = getPlayer();', {}, {})

    def test_repeatable_idempotent_and_does_not_mutate_input(self):
        original = dict(self.texts)
        prepared = self.transform(self.texts)
        self.assertEqual(prepared, self.transform(dict(reversed(list(self.texts.items())))))
        self.assertEqual(prepared, self.transform(prepared))
        self.assertEqual(original, self.texts)


if __name__ == '__main__':
    unittest.main()
