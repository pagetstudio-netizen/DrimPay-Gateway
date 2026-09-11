-- Seed de réparation ciblé du marchand Bieleu Tcheumeni Dayna Clea.
--
-- À exécuter dans l'éditeur SQL Supabase après vérification du marchand.
-- Le bloc échoue volontairement si l'état observé n'est plus celui attendu,
-- afin d'éviter d'écraser un nouveau crédit ou une nouvelle transaction.

BEGIN;

DO $$
DECLARE
  target_user_id integer;
  live_wallet_id integer;
  sandbox_wallet_id integer;
  target_count integer;
  sandbox_balance numeric;
  live_balance numeric;
BEGIN
  SELECT t.user_id
    INTO target_user_id
    FROM transactions t
   WHERE t.reference IN ('CI-C61CC1BCA1FA29DD', 'CI-7DE7C5452A26453C')
   GROUP BY t.user_id
   HAVING COUNT(*) = 2;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Les deux transactions cibles ne sont pas présentes pour un même marchand';
  END IF;

  SELECT COUNT(*)
    INTO target_count
    FROM transactions t
   WHERE t.user_id = target_user_id
     AND t.reference IN ('CI-C61CC1BCA1FA29DD', 'CI-7DE7C5452A26453C')
     AND t.mode = 'live'
     AND t.type = 'payin'
     AND t.status = 'success'
     AND t.amount = 200
     AND t.fee = 7
     AND t.net_amount = 193;

  IF target_count <> 2 THEN
    RAISE EXCEPTION 'Les transactions cibles ne correspondent pas exactement aux deux succès Live attendus';
  END IF;

  SELECT w.id, w.balance
    INTO sandbox_wallet_id, sandbox_balance
    FROM wallets w
   WHERE w.user_id = target_user_id
     AND w.country_code = 'CI'
     AND w.currency = 'XOF'
     AND w.mode = 'sandbox';

  SELECT w.id, w.balance
    INTO live_wallet_id, live_balance
    FROM wallets w
   WHERE w.user_id = target_user_id
     AND w.country_code = 'CI'
     AND w.currency = 'XOF'
     AND w.mode = 'live';

  IF sandbox_wallet_id IS NULL OR live_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Les wallets CI Sandbox et Live sont requis';
  END IF;

  IF sandbox_balance <> 386 OR live_balance <> 193 THEN
    RAISE EXCEPTION 'Soldes inattendus: Sandbox %, Live %', sandbox_balance, live_balance;
  END IF;

  UPDATE transactions
     SET wallet_id = live_wallet_id,
         updated_at = NOW()
   WHERE user_id = target_user_id
     AND reference IN ('CI-C61CC1BCA1FA29DD', 'CI-7DE7C5452A26453C');

  -- Les 193 XOF déjà crédités manuellement compensent un des deux paiements.
  -- Le solde Live final attendu est donc 386 XOF, soit 2 x 193 XOF nets.
  UPDATE wallets
     SET balance = 0
   WHERE id = sandbox_wallet_id;

  UPDATE wallets
     SET balance = 386
   WHERE id = live_wallet_id;
END
$$;

COMMIT;