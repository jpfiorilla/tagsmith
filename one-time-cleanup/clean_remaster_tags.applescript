-- Clean remaster/edition tags + tidy stray spaces in Apple Music
-- Renames 73 tracks by persistent ID (65 tag strips + 8 whitespace fixes).
-- SAFE & IDEMPOTENT: only renames when current name still matches "before".
-- Play counts, ratings, dates and file locations are preserved.

set changeList to {}
set end of changeList to {"48142725F544B347", "Boy Who Cried Wolf (LP Version)", "Boy Who Cried Wolf"}
set end of changeList to {"1D3853374CBF23AA", "The Sprawl (2012 Remastered Version)", "The Sprawl"}
set end of changeList to {"12C2369C4E337EF1", "'Cross the Breeze (2012 Remastered Version)", "'Cross the Breeze"}
set end of changeList to {"94C9389CAB94148F", "Eric's Trip (2012 Remastered Version)", "Eric's Trip"}
set end of changeList to {"3253C56AAE696C8E", "Total Trash (2012 Remastered Version)", "Total Trash"}
set end of changeList to {"A80EA4A9667F06DD", "Hey Joni (2012 Remastered Version)", "Hey Joni"}
set end of changeList to {"330D3F3BE111BDD1", "Providence (2012 Remastered Version)", "Providence"}
set end of changeList to {"39857D86BBD4AAA9", "Candle (2012 Remastered Version)", "Candle"}
set end of changeList to {"189C35F9A9C9C9A9", "Rain King (2012 Remastered Version)", "Rain King"}
set end of changeList to {"915934E882958BC0", "Kissability (2012 Remastered Version)", "Kissability"}
set end of changeList to {"7B23B0404A656880", "Trilogy: a) The Wonder  (2012 Remastered Version)", "Trilogy: a) The Wonder"}
set end of changeList to {"F348399F07D4B794", "Trilogy: b) Hyperstation (2012 Remastered Version)", "Trilogy: b) Hyperstation"}
set end of changeList to {"321CC83EE1FFEC41", "Trilogy: z) Eliminator Jr. (2012 Remastered Version)", "Trilogy: z) Eliminator Jr."}
set end of changeList to {"3309B118AA92CEED", "We Disappear (Remaster 2023)", "We Disappear"}
set end of changeList to {"0703D049A57B0EE1", "Open Eye Signal (Remaster 2023)", "Open Eye Signal"}
set end of changeList to {"A67FFE4AA10EC62E", "Breathe This Air (Remaster 2023)", "Breathe This Air"}
set end of changeList to {"AA53AE0670ACFBE1", "Collider (Remaster 2023)", "Collider"}
set end of changeList to {"0E874FF1B2D2D8FE", "Abandon Window (Remaster 2023)", "Abandon Window"}
set end of changeList to {"0E76D4B5037D69B1", "Form by Firelight (Remaster 2023)", "Form by Firelight"}
set end of changeList to {"2B6853ED757519DE", "Sun Harmonics (Remaster 2023)", "Sun Harmonics"}
set end of changeList to {"3DA7D0375631E824", "Immunity (Remaster 2023)", "Immunity"}
set end of changeList to {"8054DA6368D95C37", "Aurora (Remaster)", "Aurora"}
set end of changeList to {"31C111DE403656A8", "Morning (Remaster)", "Morning"}
set end of changeList to {"FB3E28D583E66C87", "Logic Moon (Remaster)", "Logic Moon"}
set end of changeList to {"45F3A8904C415BC8", "Moon (Remaster)", "Moon"}
set end of changeList to {"9B880B78C0712765", "Berlin (Remaster)", "Berlin"}
set end of changeList to {"F8A18649267A950C", "Iano (Remaster)", "Iano"}
set end of changeList to {"C163D45ECFFD2338", "Avaol (Remaster)", "Avaol"}
set end of changeList to {"0728A219319047E1", "Barco (Remaster)", "Barco"}
set end of changeList to {"87C5B15CC5D3DE5A", "The Plum Blossom (Remastered 2023)", "The Plum Blossom"}
set end of changeList to {"54089C7108D198A4", "Ching Miau (Remastered 2023)", "Ching Miau"}
set end of changeList to {"1B0D9BC3FDE3DCF1", "Don't Blame Me (Remastered 2023)", "Don't Blame Me"}
set end of changeList to {"6EDAF512EC81CAB2", "Love Theme From Spartacus (Remastered 2023)", "Love Theme From Spartacus"}
set end of changeList to {"DB32090CC2CD74DA", "Snafu (Remastered 2023)", "Snafu"}
set end of changeList to {"B1E0F7083C721A05", "Purple Flower (Remastered 2023)", "Purple Flower"}
set end of changeList to {"552607C52834CBF0", "Love Theme From The Robe (Remastered 2023)", "Love Theme From The Robe"}
set end of changeList to {"8953055E649DFF1D", "The Three Faces Of Balal (Remastered 2023)", "The Three Faces Of Balal"}
set end of changeList to {"786A104900CCBDDD", "A Concert For Television (33 RPM LP Version)", "A Concert For Television"}
set end of changeList to {"B5CD4937F5077446", "Palmen Aus Leder (33 RPM LP Version)", "Palmen Aus Leder"}
set end of changeList to {"97E2D7637314C6C9", "Tierbeobachtung (33 RPM LP Version)", "Tierbeobachtung"}
set end of changeList to {"3068ED8E25C28422", "The Ballad Of Soap Und Die Gema Nimmt Kontakt Auf (33 RPM LP Version)", "The Ballad Of Soap Und Die Gema Nimmt Kontakt Auf"}
set end of changeList to {"7C5FF1509877D9D9", "Up To My Same Old Trick Again (33 RPM LP Version)", "Up To My Same Old Trick Again"}
set end of changeList to {"467C59622B5CEE83", "Happening Tone (33 RPM LP Version)", "Happening Tone"}
set end of changeList to {"8992143471B72079", "Sonny's Dream (Expanded Edition)", "Sonny's Dream"}
set end of changeList to {"DA494285DD3A0FF7", "Ballad For Samuel (Expanded Edition)", "Ballad For Samuel"}
set end of changeList to {"F3881200E3D18EBD", "The Black Apostles (Expanded Edition)", "The Black Apostles"}
set end of changeList to {"90EC320E2B48A37A", "The Golden Pearl (Expanded Edition)", "The Golden Pearl"}
set end of changeList to {"77AC95DE3952EB95", "Daughter Of Cochise (Expanded Edition)", "Daughter Of Cochise"}
set end of changeList to {"FBB158A29D2BDB28", "Sandy And Niles (Expanded Edition)", "Sandy And Niles"}
set end of changeList to {"5690F1081B32FC71", "Odi et Amo (Remastered)", "Odi et Amo"}
set end of changeList to {"8940EA5901B830BF", "Englabörn (Remastered)", "Englabörn"}
set end of changeList to {"A01521DE7AE9EB26", "Jói & Karen (Remastered)", "Jói & Karen"}
set end of changeList to {"8D52D1794C24F95D", "Þetta Gerist Á Bestu Bæjum (Remastered)", "Þetta Gerist Á Bestu Bæjum"}
set end of changeList to {"92874E949A34F1DF", "Sálfræðingur (Remastered)", "Sálfræðingur"}
set end of changeList to {"BB631179B2BC0300", "\"Ég Sleppi Þér Aldrei\" (Remastered)", "\"Ég Sleppi Þér Aldrei\""}
set end of changeList to {"5214849171FB0B11", "Sálfræðingur Deyr (Remastered)", "Sálfræðingur Deyr"}
set end of changeList to {"9656AF06156849CF", "Bað (Remastered)", "Bað"}
set end of changeList to {"FC7A7EE2B5099863", "\"Ég Heyrði Allt Án Þess Að Hlusta\" (Remastered)", "\"Ég Heyrði Allt Án Þess Að Hlusta\""}
set end of changeList to {"4E4675C77107090A", "Karen Býr Til Engil (Remastered)", "Karen Býr Til Engil"}
set end of changeList to {"4A0D32934E0CE768", "Englabörn - Tilbrigði (Remastered)", "Englabörn - Tilbrigði"}
set end of changeList to {"0C2D291FF8212874", "\"Ég Átti Gráa Æsku\" (Remastered)", "\"Ég Átti Gráa Æsku\""}
set end of changeList to {"E57A0358B9FB9B98", "Krókódíll (Remastered)", "Krókódíll"}
set end of changeList to {"3F898375DD2DDC99", "\"Ef Ég Hefði Aldrei…\" (Remastered)", "\"Ef Ég Hefði Aldrei…\""}
set end of changeList to {"D0DA9C9A64C0961A", "…Eins Og Venjulegt Fólk (Remastered)", "…Eins Og Venjulegt Fólk"}
set end of changeList to {"6D870B3C39A755DD", "Odi et Amo - bis (Remastered)", "Odi et Amo - bis"}
set end of changeList to {"32B9B165CE1D9AC4", "Combine  Advisory", "Combine Advisory"}
set end of changeList to {"F7687E25F8BA09BB", "live:  d|lp 1.1 Live at The Metropolitan Museum of Art, September 11, 2011", "live: d|lp 1.1 Live at The Metropolitan Museum of Art, September 11, 2011"}
set end of changeList to {"EAD2F7CE2A0D3223", "live:  d|lp 1.1 Live at The 54th Venice Biennale, October 18, 2008", "live: d|lp 1.1 Live at The 54th Venice Biennale, October 18, 2008"}
set end of changeList to {"E872732D3CF98B56", "Expressway Medley ", "Expressway Medley"}
set end of changeList to {"A9965A27AD16A87F", "Let the Battles Begin - Fight On Medley ", "Let the Battles Begin - Fight On Medley"}
set end of changeList to {"B609F092DB0A3EEB", "Sector 7 Undercity Medley ", "Sector 7 Undercity Medley"}
set end of changeList to {"BA0D11B6D89015B3", "Aerith's Theme - Home Again ", "Aerith's Theme - Home Again"}
set end of changeList to {"FC27106D2EF36521", "B D B ", "B D B"}

tell application "Music"
	set renamedCount to 0
	set skippedCount to 0
	set notFoundCount to 0
	repeat with c in changeList
		set pid to item 1 of c
		set beforeName to item 2 of c
		set afterName to item 3 of c
		try
			set theTrack to (some track of library playlist 1 whose persistent ID is pid)
			if (name of theTrack) is beforeName then
				set name of theTrack to afterName
				set renamedCount to renamedCount + 1
			else
				set skippedCount to skippedCount + 1
			end if
		on error
			set notFoundCount to notFoundCount + 1
		end try
	end repeat
	display dialog "Tag cleanup complete." & return & "Renamed: " & renamedCount & return & "Skipped (already clean / no match): " & skippedCount & return & "Not found: " & notFoundCount buttons {"OK"} default button "OK"
end tell
