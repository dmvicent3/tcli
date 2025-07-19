import { Command } from 'commander'
import { initCommand } from './commands/init'
import { addCommand } from './commands/add'
import { updateCommand } from './commands/update'
import { removeCommand } from './commands/remove'
import { batchCommand } from './commands/batch'
import {
  nsAddCommand,
  nsRemoveCommand,
  nsListCommand,
  nsDefaultCommand,
} from './commands/namespace'
import {
  langAddCommand,
  langRemoveCommand,
  langListCommand,
} from './commands/language'
import { verifyCommand } from './commands/verify'

const program = new Command()

program
  .name('tcli')
  .description('Translation CLI for next-translate')
  .version('1.0.0')

program
  .command('init')
  .description('Initialize translation configuration')
  .action(initCommand)

program
  .command('add [key] [value]')
  .description('Add a translation key')
  .option('-k, --key <key>', 'Translation key')
  .option('-v, --value <value>', 'Translation value')
  .option('-n, --ns <namespace>', 'Namespace')
  .option('-l, --lang <language>', 'Language')
  .action(async (key, value, options) => {
    await addCommand(
      key || options.key,
      value || options.value,
      options.ns,
      options.lang
    )
  })

program
  .command('update [key] [value]')
  .description('Update a translation key')
  .option('-k, --key <key>', 'Translation key')
  .option('-v, --value <value>', 'Translation value')
  .option('-n, --ns <namespace>', 'Namespace')
  .option('-l, --lang <language>', 'Language')
  .action(async (key, value, options) => {
    await updateCommand(
      key || options.key,
      value || options.value,
      options.ns,
      options.lang
    )
  })

program
  .command('remove [key]')
  .description('Remove a translation key')
  .option('-k, --key <key>', 'Translation key')
  .option('-n, --ns <namespace>', 'Namespace')
  .option('-l, --lang <language>', 'Language')
  .action(async (key, options) => {
    await removeCommand(key || options.key, options.ns, options.lang)
  })

program
  .command('batch [file]')
  .description('Batch translate from file')
  .option('-f, --file <file>', 'JSON file with translations')
  .option('-n, --ns <namespace>', 'Namespace')
  .option('-l, --langs <languages>', 'Comma-separated languages')
  .action(async (file, options) => {
    await batchCommand(file || options.file, options.ns, options.langs)
  })

const nsCommand = program.command('ns').description('Namespace management')

nsCommand
  .command('add <name>')
  .description('Add namespace')
  .action(nsAddCommand)

nsCommand
  .command('remove <name>')
  .description('Remove namespace')
  .action(nsRemoveCommand)

nsCommand.command('list').description('List namespaces').action(nsListCommand)

nsCommand
  .command('default <name>')
  .description('Set default namespace')
  .action(nsDefaultCommand)

const langCommand = program.command('lang').description('Language management')

langCommand
  .command('add <lang>')
  .description('Add language')
  .action(langAddCommand)

langCommand
  .command('remove <lang>')
  .description('Remove language')
  .action(langRemoveCommand)

langCommand
  .command('list')
  .description('List languages')
  .action(langListCommand)

program
  .command('verify')
  .description('Verify missing translation keys')
  .action(verifyCommand)

program.parse()
