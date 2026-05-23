/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Chapter {
  title: string;
  time: number;
  thumbnail?: string;
}

export const CHAPTERS: Chapter[] = [
  { title: "Introduction", time: 0, thumbnail: "/images/Pardey_CostControl_VimOTT_1920x1080.jpg" },
  { title: "Interlude 1", time: 514, thumbnail: "/images/chapter-thumbnails/interlude.jpg" },
  { title: "Unstoppable Boat", time: 554, thumbnail: "/images/chapter-thumbnails/unstoppable-boat.jpg" },
  { title: "Sails", time: 769, thumbnail: "/images/chapter-thumbnails/sails.jpg" },
  { title: "Interlude 2", time: 1255, thumbnail: "/images/chapter-thumbnails/interlude.jpg" },
  { title: "Being Comfortable at Anchor", time: 1495, thumbnail: "/images/chapter-thumbnails/being-comfortable-at-anchor.jpg" },
  { title: "Yacht Insurance", time: 1614, thumbnail: "/images/chapter-thumbnails/yacht-insurance.jpg" },
  { title: "Health Insurance", time: 1739, thumbnail: "/images/chapter-thumbnails/health-insurance.jpg" },
  { title: "Boat as Warehouse", time: 1857, thumbnail: "/images/chapter-thumbnails/boat-as-warehouse.jpg" },
  { title: "Onboard Communications", time: 1939, thumbnail: "/images/chapter-thumbnails/onboard-communications.jpg" },
  { title: "Cruising in Company", time: 2032, thumbnail: "/images/chapter-thumbnails/cruising-in-company.jpg" },
  { title: "Purchase Local Foods", time: 2388, thumbnail: "/images/chapter-thumbnails/purchase-local-foods.jpg" },
  { title: "Interlude 3", time: 2483, thumbnail: "/images/chapter-thumbnails/interlude.jpg" },
  { title: "Flying Home", time: 2785, thumbnail: "/images/chapter-thumbnails/flying-home.jpg" },
  { title: "Paper Charts & Guide Books", time: 2917, thumbnail: "/images/chapter-thumbnails/paper-charts-guide-books.jpg" },
  { title: "Haul Out", time: 3083, thumbnail: "/images/chapter-thumbnails/haul-out.jpg" },
  { title: "Less Cruised Areas", time: 3283, thumbnail: "/images/chapter-thumbnails/less-cruised-areas.jpg" },
  { title: "How to Spend Some Money", time: 3411, thumbnail: "/images/chapter-thumbnails/how-to-spend-some-money.jpg" },
  { title: "Conclusion", time: 3746, thumbnail: "/images/chapter-thumbnails/conclusion.jpg" },
  { title: "Credits", time: 3783, thumbnail: "/images/chapter-thumbnails/conclusion.jpg" }
];

export interface Topic {
  keywords: string[];
  chapter: string;
  responses: string[];
  transcript: string;
}

export const TOPIC_MAP: Topic[] = [
  {
    keywords: ["maintenance", "hull", "seamanship", "storm", "rigging", "unstoppable"],
    chapter: "Unstoppable Boat",
    responses: [
      "Aye, an unstoppable boat starts with a solid hull and a mind for safety. Lin emphasizes that your boat should be your refuge, not your liability.",
      "Cost control means doin' the heavy work before you leave the dock. Riggin' and hull integrity are where you can't afford to be cheap, but you can be smart with DIY maintenance.",
      "Check your through-hulls and secure your hatchways. A boat that can take anything the sea throws at it is the cheapest insurance you'll ever have."
    ],
    transcript: "Lin Pardey: 'An unstoppable boat is one that gives you confidence in any sea. It starts with the basics: a sound hull, secure through-hulls, and a rig you can trust. I advocate for keeping systems simple so you can maintain them yourself. The cost of neglect is far higher than the cost of prevention. Before you head offshore, ensure your boat is prepared to handle the unexpected. It's not about expensive gadgets, it's about seamanship and solid construction.'"
  },
  {
    keywords: ["travel", "destination", "safe", "unusual", "areas", "cruised"],
    chapter: "Less Cruised Areas",
    responses: [
      "Cruisin' where others don't goes a long way in savin' coin. Less crowded ports often mean cheaper supplies and more welcome faces.",
      "Lin's advice: 'Don't just follow the crowd.' The most rewarding experiences—and the best bargains—are often found off the beaten track.",
      "Savin' money is easier when you're not competin' for limited resources in popular hubs. Seek out the quiet anchorages where nature is your main companion."
    ],
    transcript: "Lin Pardey: 'Seeking out less cruised areas is one of the best ways to keep your budget in check. Popular hubs often have inflated prices for cruisers, but if you venture even slightly off the beaten track, you'll find everything is less expensive and the hospitality is more genuine. It's often safer too, as you're not a target in a crowded harbor. Don't be afraid to visit the places others overlook—that's where the real magic of cruising happens, and your dollar goes twice as far.'"
  },
  {
    keywords: ["sail", "sails", "rigging", "mast", "spar", "standing rigging", "running rigging"],
    chapter: "Sails",
    responses: [
      "Aye, sails be the heart of any cruising boat! Lin stresses keepin' 'em simple and well-maintained. A good suit of sails'll last years if you reef early, avoid floggin', and inspect regularly for chafe. Consider tradewind sails for downwind passages - they save wear on your main and are dead simple to handle.",
      "Sails cost control starts with choosin' quality over quantity. Lin recommends dacron sails over fancy laminates for most cruisers. Keep your rig simple - no fancy in-mast furling that breaks down. And remember: a well-set sail is a fuel-saver when the wind's fair.",
      "For sail care, Lin's golden rule: 'If it ain't broke, don't fix it... but inspect it regular.' Check for UV degradation, especially at the leech. A small repair now saves a big replacement bill later. And consider a storm trisail - cheaper than a big genoa and might save your mast in a blow."
    ],
    transcript: "Lin Pardey: 'When it comes to sails, I believe in keeping things simple. A good suit of Dacron sails will last you 15-20 years if you treat them right. The key is to reef early - don't wait for the wind to build before you reduce sail. That flogging will destroy your sails faster than anything else. For downwind sailing, consider tradewind sails. They're inexpensive, easy to handle, and save tremendous wear on your mainsail. And remember, a well-maintained sail is your best fuel saver - it will power your boat efficiently and reduce your engine hours significantly.'"
  },
  {
    keywords: ["anchor", "anchoring", "comfortable", "ground tackle", "rode", "chain"],
    chapter: "Being Comfortable at Anchor",
    responses: [
      "Anchoring comfort be about choosin' the right spot and havin' confidence in your ground tackle. Lin says: 'A good night's sleep at anchor is worth more than fancy marina fees.' Use your anchor alarm, check your swing radius, and don't be shy about re-positioning if the swell's uncomfortable.",
      "For cost control at anchor, skip the marina when you can. A good anchor, chain, and rode setup pays for itself in saved dockage fees. Lin recommends all-chain rode for better chafe resistance and easier retrieval. And remember: a oversized anchor in good holding ground beats fancy gear in poor bottom.",
      "Comfort at anchor means choosin' spots with good protection but not too crowded. Use your dinghy to explore before committing. Lin's tip: anchor early enough to enjoy cocktail hour without worryin' about darkenin' skies."
    ],
    transcript: "Lin Pardey: 'Being comfortable at anchor is about more than just good ground tackle - it's about peace of mind. I always say a good night's sleep at anchor is worth more than any marina fee. Choose your spot carefully - look for protection from the prevailing winds and swells. Use your anchor alarm religiously, and don't be afraid to move if conditions change. For ground tackle, I recommend all-chain rode for its chafe resistance and ease of retrieval. A slightly oversized anchor in good holding ground will give you confidence. And remember, the best anchor is the one you trust completely.'"
  },
  {
    keywords: ["insurance", "yacht insurance", "boat insurance", "coverage"],
    chapter: "Yacht Insurance",
    responses: [
      "Yacht insurance be a necessary evil, but you can keep costs down by bein' a low-risk cruiser. Lin recommends full coverage for bluewater passages but look for cruisers' discounts. Shop around annually and consider higher deductibles to lower premiums.",
      "Insurance wisdom from Lin: 'Don't insure against stupidity.' That means proper maintenance, good seamanship, and realistic expectations. Coastal cruisers can often get by with liability-only coverage, savin' hundreds annually.",
      "For cost control, get quotes from multiple insurers and ask about cruisers' discounts. Consider separate policies for the boat and personal effects. And remember: a well-documented maintenance log can lower your premiums significantly."
    ],
    transcript: "Lin Pardey: 'Yacht insurance is one area where you don't want to cut corners, but you can be smart about it. For bluewater passages, full coverage is essential. For coastal cruising, liability-only might suffice and save you hundreds. Shop around annually - rates can vary significantly between insurers. Ask about cruisers' discounts and consider higher deductibles to lower premiums. Most importantly, maintain good records of your maintenance and safety equipment. A well-documented boat with good safety gear will qualify for lower rates. Remember, insurance is about transferring risk, not avoiding responsibility.'"
  },
  {
    keywords: ["health", "medical", "health insurance", "doctor", "flying home", "evacuation", "medical evacuation", "helicopter", "emergency"],
    chapter: "Health Insurance",
    responses: [
      "Health insurance offshore be about plannin' ahead. Lin recommends travel medical insurance with evacuation coverage for extended cruising. Consider diver's insurance for those coral cuts and fishing hook accidents!",
      "Cost control means shoppin' for policies that cover pre-existing conditions if you're over 50. Lin's tip: get comprehensive coverage for the first year out, then scale back as you prove you're a low-risk cruiser.",
      "Don't forget medical supplies and trainin' - they're cheaper than emergency evacuations. Lin always carries a good first-aid kit and knows basic medical procedures. Prevention through good hygiene and diet saves more than any insurance."
    ],
    transcript: "Lin Pardey: 'Health insurance offshore requires careful planning. For extended cruising, I recommend travel medical insurance with evacuation coverage - those helicopter rides home can cost $50,000 or more. If you're over 50, make sure your policy covers pre-existing conditions. Start with comprehensive coverage for your first year out, then you can often scale back as you prove you're a low-risk cruiser. Don't forget about supplemental insurance for divers or watersports enthusiasts. Most importantly, invest in good medical training and supplies. A well-stocked first-aid kit and knowledge of basic medical procedures can prevent many emergencies and save you thousands in medical evacuation costs.'"
  },
  {
    keywords: ["storage", "warehouse", "boat storage", "gear"],
    chapter: "Boat as Warehouse",
    responses: [
      "Your boat as warehouse means thinkin' vertical and multi-purpose. Lin's philosophy: 'Everything should earn its keep on board.' That means tools that serve multiple purposes and storage that doubles as furniture.",
      "Cost control through efficiency: organize so you can find things quickly, reducin' the temptation to buy duplicates. Lin recommends clear plastic bins for dry storage and considers every cubic foot of space precious.",
      "Think seasonal storage too - what you don't need in the tropics can be left in storage ashore. Lin's tip: label everything clearly and maintain an inventory list to avoid buyin' what you already own."
    ],
    transcript: "Lin Pardey: 'Think of your boat as a floating warehouse - every cubic foot of space has value. I believe everything on board should earn its keep, either through utility or by serving multiple purposes. Use vertical space efficiently with shelves and hanging storage. Clear plastic bins are invaluable for dry storage and allow you to see contents at a glance. Think multi-purpose - a storage compartment that also serves as a seat saves space. Maintain an inventory list to avoid buying duplicates. For seasonal gear, consider shore-side storage for items you won't need in certain climates. The key is organization - if you can find things quickly, you're less likely to buy replacements.'"
  },
  {
    keywords: ["communication", "radio", "email", "satellite", "phone"],
    chapter: "Onboard Communications",
    responses: [
      "Communications cost control means choosin' the right tools for your cruisin' style. Lin recommends SSB radio for ocean passages - cheap to operate once you have the gear. For email, consider sailmail or ham radio gateways.",
      "Skip the expensive satellite phones for coastal work. Lin uses VHF radio extensively and carries a basic cell phone for when in range. For internet, wifi hotspots in marinas beat expensive satellite systems.",
      "The key be reliability over glitz. Lin's rule: 'If you can't fix it with basic tools, you probably don't need it.' That means simple, robust communication systems that work when you need 'em most."
    ],
    transcript: "Lin Pardey: 'Communications should be reliable and cost-effective. For ocean passages, SSB radio is my recommendation - once you have the equipment, operating costs are minimal. For email, consider services like SailMail or ham radio gateways rather than expensive satellite systems. Skip satellite phones for coastal cruising - VHF radio and a basic cell phone work fine when you're in range. For internet access, marina wifi hotspots are far cheaper than satellite systems. The key is choosing systems you can maintain and repair yourself. If you can't fix it with basic tools, you probably don't need it. Reliability over glitz - that's my communications philosophy.'"
  },
  {
    keywords: ["company", "buddy", "cruising company", "alone"],
    chapter: "Cruising in Company",
    responses: [
      "Cruisin' in company can cut costs significantly through shared expenses and safety. Lin recommends buddy-boatin' with like-minded folks, but choose carefully - good company makes the miles fly by.",
      "Cost savings come from shared fuel, provisions, and sometimes even boat parts. But Lin warns: 'Choose your cruising companions like you choose your spouse - for the long haul.' Different paces and standards can create more problems than they solve.",
      "For solo cruisers, Lin suggests joinin' the informality of a loose flotilla rather than formal arrangements. That way you get the benefits of company without the commitments that can sour."
    ],
    transcript: "Lin Pardey: 'Cruising in company can cut your costs significantly, but choose your companions carefully. Buddy boating with like-minded people allows you to share expenses for fuel, provisions, and sometimes even boat parts. Safety in numbers is real - having another boat nearby provides security and assistance. However, different cruising paces and standards can create more problems than they solve. I always say, choose your cruising companions like you choose your spouse - for the long haul. For solo cruisers, consider joining the informality of a loose flotilla rather than formal rally arrangements. That way you get the benefits of company without the commitments that can sometimes sour relationships.'"
  },
  {
    keywords: ["food", "provisions", "local", "fresh", "cooking"],
    chapter: "Purchase Local Foods",
    responses: [
      "Local food purchasin' be the best way to save money and eat well while cruisin'. Lin's philosophy: 'Eat where you are.' Fresh local produce is cheaper, better, and supports the local economy.",
      "Cost control means buyin' in season and learnin' local markets. Skip the imported fancy foods - you'll pay premium prices for inferior quality. Lin recommends learnin' basic local recipes to make the most of what you find.",
      "Think preservation too: dehydratin', freezin', or simple picklin' extends the life of fresh purchases. Lin's tip: a good pressure cooker can turn inexpensive local proteins into gourmet meals."
    ],
    transcript: "Lin Pardey: 'Eating local is the best way to save money and eat well while cruising. My philosophy is simple: eat where you are. Fresh local produce is almost always cheaper and better than imported foods. Learn to shop local markets and buy in season - you'll get better quality at lower prices. Skip the imported fancy foods that cost premium prices for inferior quality. Learn basic local recipes to make the most of what you find. Consider preservation techniques like dehydration, freezing, or simple pickling to extend the life of your purchases. A good pressure cooker can turn inexpensive local proteins into gourmet meals. Eating local not only saves money but supports the local economy and gives you authentic culinary experiences.'"
  },
  {
    keywords: ["flying home", "visiting family", "leave boat", "airline", "travel", "break"],
    chapter: "Flying Home",
    responses: [
      "Aye, sometimes you need to leave the boat and head home for a spell. Lin's advice be to secure the boat like she's stayin' forever and find a trustworthy yard.",
      "Flyin' home can be spendy, but plannin' ahead and flyin' from major hubs can save a lot of gold. Lin recommends lookin' for budget carriers and considerin' off-peak travel.",
      "The cost of a trip home should be part of your budget. Lin says a mid-vessel break can recharge your batteries and make the next leg even better."
    ],
    transcript: "Lin Pardey: 'Planning to fly home occasionally is a realistic part of long-term cruising. It's often necessary for family reasons or simply to take a break and recharge. To control costs, plan your trips from major airline hubs where competition keeps fares lower. Secure your boat in a safe, reputable yard or with a trusted boat-sitter - the peace of mind is worth the cost. We always treated a trip home as a chance to stock up on lightweight essentials that were hard to find elsewhere. Budget for these trips from the beginning so they don't catch you off guard. A well-planned break can actually save you money by preventing cruiser burnout.'"
  },
  {
    keywords: ["charts", "guide", "navigation", "maps", "piloting"],
    chapter: "Paper Charts & Guide Books",
    responses: [
      "Paper charts and guide books remain Lin's preference for navigation. 'You can read a paper chart in the rain with salt water on your hands,' she says. Electronic charts are great backups but not replacements.",
      "Cost control means buyin' charts for your actual route, not everywhere. Lin recommends pilot books and cruising guides over expensive electronic systems. Local knowledge from other cruisers beats any chart.",
      "For guides, Lin suggests buyin' used or borrowin' from fellow cruisers. The best information comes from those who've been there recently. And remember: a sharp pencil and notebook are cheaper than any electronic gadget."
    ],
    transcript: "Lin Pardey: 'I still prefer paper charts for navigation. You can read a paper chart in the rain with salt water on your hands - try that with an electronic chart! Electronic charts are wonderful backups, but they're not replacements for paper. For cost control, only buy charts for the areas you'll actually cruise. Pilot books and cruising guides are far more valuable than expensive electronic navigation systems. Local knowledge from other cruisers who've been there recently beats any chart. Consider buying used guides or borrowing them from fellow cruisers. And remember, a sharp pencil and notebook for recording soundings and hazards are cheaper and more reliable than any electronic gadget.'"
  },
  {
    keywords: ["haul", "haulout", "haul out", "survey", "maintenance"],
    chapter: "Haul Out",
    responses: [
      "Haul outs should be planned and efficient. Lin recommends haulin' every 2-3 years for a thorough inspection and bottom paint. Do your own work where possible to cut labor costs significantly.",
      "Cost control means choosin' yards carefully - compare prices and services. Lin's tip: time your haulout for slow seasons when yards are more negotiable. And consider mobile services for work you can't do yourself.",
      "During haulout, Lin insists on thorough inspections: check for osmosis, keel bolts, and rigging. Prevention now saves expensive repairs later. And remember: a clean bottom saves fuel and money every mile."
    ],
    transcript: "Lin Pardey: 'Haul outs should be planned events, not emergencies. I recommend hauling every 2-3 years for a thorough inspection and bottom paint job. Do as much work as you can yourself to cut labor costs significantly. Choose your yard carefully - compare prices and services between facilities. Time your haulout for slow seasons when yards are more negotiable on pricing. Consider mobile services for work you can't handle yourself. During the haulout, insist on thorough inspections: check for osmosis, examine keel bolts, inspect rigging thoroughly. Prevention now saves expensive repairs later. And remember, a clean bottom saves fuel and money on every mile you sail.'"
  },
  {
    keywords: ["money", "spend", "budget", "finances", "costs"],
    chapter: "How to Spend Some Money",
    responses: [
      "Spendin' money wisely means investin' in safety and reliability first. Lin's rule: 'The cheapest boat is the one that gets you home safely.' That means good ground tackle, sails, and engine maintenance.",
      "For upgrades, Lin recommends spendin' on systems that pay for themselves: good wind instruments, reliable autopilot, or efficient refrigeration. Skip the fancy electronics that break down when you need 'em most.",
      "Lin's philosophy: 'Cruising is about time, not money.' Invest in gear that gives you confidence and comfort, then enjoy the simple life. The best money spent is on experiences that create memories."
    ],
    transcript: "Lin Pardey: 'When it comes to spending money on your boat, invest in safety and reliability first. My rule is: the cheapest boat is the one that gets you home safely. That means good ground tackle, well-maintained sails, and reliable engine systems. For upgrades, spend on systems that pay for themselves - good wind instruments, a reliable autopilot, efficient refrigeration. Skip the fancy electronics that break down when you need them most. Cruising is about time, not money. Invest in gear that gives you confidence and comfort, then enjoy the simple life. The best money spent is on experiences that create memories, not on things that create worries.'"
  },
  {
    keywords: ["music", "song", "musical", "interlude", "melody", "play some music", "entertainment"],
    chapter: "Interlude 1",
    responses: [
      "Aye, every sailor needs a bit of music to keep the spirits high! Here's a fine musical interlude for ya.",
      "A tune at sea is like a fair wind for the soul. Enjoy this bit of music, matey.",
      "Music and the sea have a long history together. Let's strike up a melody!"
    ],
    transcript: "[Musical Interlude: Relaxing sea-themed music playing over footage of sailing and destination highlights.]"
  },
  {
    keywords: ["music", "song", "musical", "interlude", "melody", "play some music", "entertainment"],
    chapter: "Interlude 2",
    responses: [
      "Aye, time for another musical break! Let the music carry your thoughts for a while.",
      "A bit of melody to ease the passage. Enjoy this interlude, matey.",
      "Every ship needs a song. Here's a tune for your ears."
    ],
    transcript: "[Musical Interlude 2: Coastal scenes and relaxing music continue.]"
  },
  {
    keywords: ["music", "song", "musical", "interlude", "melody", "play some music", "entertainment"],
    chapter: "Interlude 3",
    responses: [
      "One last musical interlude for the voyage. Sit back and enjoy.",
      "The winds are calm and the music is fair. Enjoy this final tune.",
      "A musical finale to our seminar's interludes. Enjoy the view."
    ],
    transcript: "[Musical Interlude 3: Final relaxing montage with sea music.]"
  }
];
