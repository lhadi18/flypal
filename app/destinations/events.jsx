import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { googleMaps } from '../../constants/icons'
import { useGlobalStore } from '../../store/store'
import React, { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'

const Events = () => {
  const selectedAirport = useGlobalStore(state => state.selectedAirport)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Temporarily use static data
        const data = {
          events_results: [
            {
              title: 'Bad Religion',
              date: {
                start_date: 'Jun 8',
                when: 'Sat, Jun 8, 11 AM – 3 PM PDT'
              },
              address: ['The Farm at Pomona Fairplex, 2118 N White Ave', 'Pomona, CA'],
              link: 'https://open.spotify.com/concert/4uE5G7VHlNVBhbRtJ4bwoD',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=XDWZQJpcAh43n6ScYSJhNu6Oq9EFulsP3cOyWSAbbivARjQkZd418OLqjiQljoWKS1DOlbVTbxmjVxY3a2Q9nm_vh8MWkmYCBNV-n_5Rg5P61IFdGoQ',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c32e40544d673d:0x1a2eff5b0dfbbf20?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIARAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c32e40544d673d%3A0x1a2eff5b0dfbbf20&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                'Find tickets for Bad Religion at The Farm at Pomona Fairplex in Pomona on 6/8/2024 at 11:00 AM',
              ticket_info: [
                {
                  source: 'Timeout.com',
                  link: 'https://www.timeout.com/los-angeles/music/no-values',
                  link_type: 'tickets'
                },
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/events/531058/no-values-tickets',
                  link_type: 'tickets'
                },
                {
                  source: 'Spotify',
                  link: 'https://open.spotify.com/concert/4uE5G7VHlNVBhbRtJ4bwoD',
                  link_type: 'more info'
                },
                {
                  source: 'Expedia.com',
                  link: 'https://www.expedia.com/event-tickets/no-values-festival-tickets.p',
                  link_type: 'more info'
                },
                {
                  source: 'Consequence of Sound',
                  link: 'https://consequence.net/festival/no-values-2024-lineup-ticket-info/',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'The Farm at Pomona Fairplex',
                rating: 4.6,
                reviews: 23,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=The+Farm+at+Pomona+Fairplex&ludocid=1886726060456525600&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwuX7dE8ryxN62Tf68EBS7dLSfsoLWjqym_Z3BB2g_kfNnqEI57ONZgZY&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToChg1QVDZdGVmstwc3ASDYyED5LyHV0HtV8uFje335g&s=10'
            },
            {
              title: 'NF - HOPE TOUR',
              date: {
                start_date: 'Jun 8',
                when: 'Sat, Jun 8, 12 – 7 AM PDT'
              },
              address: ['Kia Forum, 3900 W Manchester Blvd', 'Inglewood, CA'],
              link: 'https://www.ticombo.com/en/discover/event/nf-hope-tour-2406072000',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=JZPrsOqfczkxTFGBEvftmjwaVomqIxcqjcCHrRz78m5G0zi4tfp7xknyRz-JTuq8XAsN0ZqjgOLxAwU92bDA9OOoWncGvFPkZSRmPPD3e3sVykvSXho',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2b6545d4575cb:0xb1eeeaa0c8fa6906?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQICRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2b6545d4575cb%3A0xb1eeeaa0c8fa6906&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                "Don't miss NF - HOPE TOUR at Kia Forum in undefined, Los Angeles, US on Fri Jun 07 2024. Tickets on sale now.",
              ticket_info: [
                {
                  source: 'Ticombo',
                  link: 'https://www.ticombo.com/en/discover/event/nf-hope-tour-2406072000',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Kia Forum',
                rating: 4.5,
                reviews: 17058,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Kia+Forum&ludocid=12821443165457901830&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs2fdOn-6XesmN_Ts9z_BO7Rj0r6z_jEpfjSNDxt4&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeDMe7yGgmamQNdjlljmEIP3YMxM8iCLmg_LQf4ci61Q&s=10'
            },
            {
              title: 'Empress Of',
              date: {
                start_date: 'Jun 7',
                when: 'Fri, Jun 7, 10 PM – Sat, Jun 8, 2 AM PDT'
              },
              address: ['The Roxy Theatre, 9009 Sunset Blvd', 'West Hollywood, CA'],
              link: 'https://www.visitwesthollywood.com/events/empress-of-06-07-2024/',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=nRzFum_JP_cdlOATfClHdmkbTTUT8twsOrfFIlLMz53g8FHhZm2Plwaa3Gz2KnrwFEN0jhlw-CSKyh21PIV9Bjn2UXjkW5GL9KmJcO2B8VxDEEQmvxg',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2bea177da9d47:0x3887e41e6eea636?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIERAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2bea177da9d47%3A0x3887e41e6eea636&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                'Concerts Empress Of Fri Jun 7th, 2024 at 10:00PM hr The Roxy Theatre 9009 W. Sunset Blvd. West Hollywood , CA',
              ticket_info: [
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/events/526979/empress-of-tickets',
                  link_type: 'tickets'
                },
                {
                  source: 'Visit West Hollywood',
                  link: 'https://www.visitwesthollywood.com/events/empress-of-06-07-2024/',
                  link_type: 'more info'
                },
                {
                  source: 'Spotify',
                  link: 'https://open.spotify.com/concert/5OwOIYDuWBW7Nwqw3fGVBb',
                  link_type: 'more info'
                },
                {
                  source: 'Community calendar | KTLA',
                  link: 'https://ktla.com/community-calendar-ktla/?_escaped_fragment_=/show/?page%3D61%26start%3D2020-03-11#!/details/empress-of/13478524/2024-06-07T21',
                  link_type: 'more info'
                },
                {
                  source: 'AARP Local',
                  link: 'https://local.aarp.org/event/empress-of-2024-06-07-tm-los-angeles-ca.html',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'The Roxy Theatre',
                rating: 4.5,
                reviews: 1422,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=The+Roxy+Theatre&ludocid=254592200458806838&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5RUZAUhYZbsbHegJLaR36V-usbiTv4AD3qT6TkBOBGq1amIQoSyNFGE0&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQ87S48GkK5KdV0Vqkr4codoHpQSsge4FRVEFjh5AoAw&s=10'
            },
            {
              title: 'Russ - ‘"It Was You All Along’ Tour',
              date: {
                start_date: 'Jun 7',
                when: 'Fri, Jun 7, 12 – 7 AM PDT'
              },
              address: ['Kia Forum, 3900 W Manchester Blvd', 'Inglewood, CA'],
              link: 'https://www.ticombo.com/en/discover/event/russ-it-was-you-all-along-tour-2406062000',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=JZPrsOqfczkxTFGBEvftmjwaVomqIxcqjcCHrRz78m5G0zi4tfp7xknyRz-JTuq8XAsN0ZqjgOLxAwU92bDA9OOoWncGvFPkZSRmPPD3e3sVykvSXho',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2b6545d4575cb:0xb1eeeaa0c8fa6906?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIGRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2b6545d4575cb%3A0xb1eeeaa0c8fa6906&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description: 'SPECIAL GUESTS 6LACK AND MELII TO JOIN ACROSS ALL DATES',
              ticket_info: [
                {
                  source: 'Ticombo',
                  link: 'https://www.ticombo.com/en/discover/event/russ-it-was-you-all-along-tour-2406062000',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Kia Forum',
                rating: 4.5,
                reviews: 17058,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Kia+Forum&ludocid=12821443165457901830&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFwgP0LOmUbI_VQPsoKB8W2Sm0lb8n7FL6tOPrQcE&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRitv9xZjZM52WZI_OZ2UJQ3HeW8z18bjYa0q5k96a47A&s=10'
            },
            {
              title: 'Anderson .Paak',
              date: {
                start_date: 'Jun 8',
                when: 'Sat, Jun 8, 1 PM PDT'
              },
              address: [
                'King Gillette Ranch, Mountains Recreation & Conservation Authority, 26800 Mulholland Hwy',
                'Calabasas, CA'
              ],
              link: 'https://www.shazam.com/artist/-/855484536',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=_7dGjmjVEu2mpnZjX4zALHMy2NoNGPdSrYJhVaV20S-yASm2d1WsQpgxBlFk55zMIHsEwVIbJw-NIWyMtnD3wV6ULbXIbLtm70UX8yEVEx1D2XgX-3U',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80e8204450cdc24f:0xc2c6a00fa53853c3?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIIRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80e8204450cdc24f%3A0xc2c6a00fa53853c3&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                "Find Anderson .Paak's top tracks, watch videos, see tour dates and buy concert tickets for Anderson .Paak.",
              ticket_info: [
                {
                  source: 'Bandsintown.com',
                  link: 'https://www.bandsintown.com/t/1031710267?app_id=js_djruckus.com&came_from=209',
                  link_type: 'tickets'
                },
                {
                  source: 'Spotify',
                  link: 'https://open.spotify.com/concert/5BtiXmqcAONO6W6aGkL4OE',
                  link_type: 'more info'
                },
                {
                  source: 'Shazam',
                  link: 'https://www.shazam.com/artist/-/855484536',
                  link_type: 'more info'
                },
                {
                  source: 'DJ Ruckus |',
                  link: 'http://djruckus.com/tour/',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'King Gillette Ranch, Mountains Recreation & Conservation Authority',
                rating: 4.6,
                reviews: 927,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=King+Gillette+Ranch,+Mountains+Recreation+%26+Conservation+Authority&ludocid=14035081277803615171&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEc1spXuVVdA7buccgc270DssbKrE9Pm6DZUC9ZUE&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRfpO5PfTywwTH0t11v6XPi9tacJK52a55XYIVrdw3Dw&s=10'
            },
            {
              title: 'Houston Astros at Los Angeles Angels',
              date: {
                start_date: 'Jun 9',
                when: 'Sun, Jun 9, 1:07 – 3:07 PM PDT'
              },
              address: ['Angel Stadium, 2000 E Gene Autry Way', 'Anaheim, CA'],
              link: 'https://www.nytimes.com/athletic/mlb/game/houston-astros-vs-los-angeles-angels/6WTkGeENkUQw8yJA/',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=x-1T3pStdvRMSlE97YuExXJo81bO-MMtkfpXGmKZ6wwnyepJ-npgzmyfNUUWqv7kz5Tx02n0eUxXSqqk4OEdi0qEyysK_2VS-FWcetLjyVtfmqGORP0',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80dcd79c883eb01d:0x2d8fe2eb50c3667a?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIKRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80dcd79c883eb01d%3A0x2d8fe2eb50c3667a&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              ticket_info: [
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/events/557524/los-angeles-angels-parking-tickets',
                  link_type: 'tickets'
                },
                {
                  source: 'Stubhub.com',
                  link: 'https://www.stubhub.com/_C-5303',
                  link_type: 'tickets'
                },
                {
                  source: 'Seatgeek.com',
                  link: 'https://seatgeek.com/los-angeles-angels-tickets/6-9-2024-anaheim-california-angel-stadium-of-anaheim/mlb/6101989?gclsrc=%7BGOOGLE-ADS-CLICK-SOURCE%7D',
                  link_type: 'tickets'
                },
                {
                  source: 'The New York Times',
                  link: 'https://www.nytimes.com/athletic/mlb/game/houston-astros-vs-los-angeles-angels/6WTkGeENkUQw8yJA/',
                  link_type: 'more info'
                },
                {
                  source: 'FOX Sports',
                  link: 'https://www.foxsports.com/mlb/houston-astros-vs-los-angeles-angels-jun-09-2024-game-boxscore-89211',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Angel Stadium',
                rating: 4.7,
                reviews: 24352,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Angel+Stadium&ludocid=3283092153676555898&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrc61WzJ4HEaJoPSoeU_rxF94pT3ADneudSZbGJGW7Owodq2LyhfvcZDc&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS28MRTGJSmTiGSfhDS64x2mHowdbZm6e0jxES1RWz8xMqG1ZVwag0zTj2eTA&s=10'
            },
            {
              title: 'Jennifer Lopez',
              date: {
                start_date: 'Jul 11',
                when: 'Thu, Jul 11, 8 PM – Sat, Jul 13, 8 PM PDT'
              },
              address: ['Kia Forum, 3900 W Manchester Blvd', 'Inglewood, CA'],
              link: 'https://open.spotify.com/concert/3QvqhmwpLkCmzpiqK6ZM4E',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=JZPrsOqfczkxTFGBEvftmjwaVomqIxcqjcCHrRz78m5G0zi4tfp7xknyRz-JTuq8XAsN0ZqjgOLxAwU92bDA9OOoWncGvFPkZSRmPPD3e3sVykvSXho',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2b6545d4575cb:0xb1eeeaa0c8fa6906?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIMRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2b6545d4575cb%3A0xb1eeeaa0c8fa6906&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description: 'Find tickets for Jennifer Lopez at Kia Forum in Inglewood on 7/11/2024 at 8:00 PM',
              ticket_info: [
                {
                  source: 'Timeout.com',
                  link: 'https://www.timeout.com/los-angeles/music/jennifer-lopez',
                  link_type: 'tickets'
                },
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/events/532962/jennifer-lopez-tickets',
                  link_type: 'tickets'
                },
                {
                  source: 'Spotify',
                  link: 'https://open.spotify.com/concert/3QvqhmwpLkCmzpiqK6ZM4E',
                  link_type: 'more info'
                },
                {
                  source: 'Community calendar | KTLA',
                  link: 'https://ktla.com/community-calendar-ktla/#!/details/jennifer-lopez-tickets-kia-forum-inglewood-this-is-me-now-tour/13141841/2024-07-11T20',
                  link_type: 'more info'
                },
                {
                  source: 'Discover Los Angeles',
                  link: 'https://www.discoverlosangeles.com/event/2024/07/11/jennifer-lopez-this-is-menow-the-tour',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Kia Forum',
                rating: 4.5,
                reviews: 17058,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Kia+Forum&ludocid=12821443165457901830&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSitEvcEUxz_9-j9X3cbOSggk4LhptnhwY77YAWIiWccAfYJV6wvHhAgcI&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNEE5UyBTHOjSFpd2KsF-E0l_-HfKsWnD5RM51qX5r4w&s=10'
            },
            {
              title: 'Freya Ridings',
              date: {
                start_date: 'Jun 5',
                when: 'May 30, 7:00 PM – Jun 27, 9:30 PM PDT'
              },
              address: ['Hotel Cafe, 1623 N Cahuenga Blvd', 'Los Angeles, CA'],
              link: 'https://www.deezer.com/en/artist/12290606',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=hRSNVTo0frgRR8M6EHP5SGqB6of1KERfFNfGNfU0RttkEbahZSlMiY3WOBjYcTJX_wvawT_-pIGn1ZiCLoOsiA_GW-2C7cKxoVGPwVOAzrV7U1vGojw',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2bf3bcda95e59:0x784261c227d4f154?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIORAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2bf3bcda95e59%3A0x784261c227d4f154&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                'Freya Ridings is the British Breakthrough success story of 2018. Last year her song ‘Lost Without You’ peaked at Number 9 in the Official Chart and stayed in the Top 10 for 8 weeks. A hymn to lost...',
              ticket_info: [
                {
                  source: 'Hotel Café | Tickets!',
                  link: 'https://www.hotelcafe.com/tickets/?s=events_view&id=13322',
                  link_type: 'more info'
                },
                {
                  source: 'Deezer',
                  link: 'https://www.deezer.com/en/artist/12290606',
                  link_type: 'more info'
                },
                {
                  source: 'DoLA',
                  link: 'https://dola.com/events/2024/6/27/freya-ridings-tickets',
                  link_type: 'more info'
                },
                {
                  source: 'blicknews',
                  link: 'https://www.blicknews.net/?_=%2Fsv%2Fartist%2F12290606%23KJWqMdlUlBn8PPpbVBjlnY7nNoJvFg%3D%3D',
                  link_type: 'more info'
                },
                {
                  source: 'unitlockit',
                  link: 'https://www.unitlockit.net/?_=%2Fus%2Fartist%2F12290606%23KJWqMdlUlBn8PPpbVBjlnY7nNoJvFg%3D%3D',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Hotel Cafe',
                rating: 4.6,
                reviews: 805,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Hotel+Cafe&ludocid=8665596119534072148&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9XuIPFWGV7-Gp68cTiENf3iYZ_8cmGVLoYgi6wqc&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKnyWibKUrEi0biF4coxxkbJVV4BmwxjnwjJvDN6upRw&s=10'
            },
            {
              title: 'The Party Never Ends',
              date: {
                start_date: 'Aug 17',
                when: 'Sat, Aug 17, 12 AM – Sun, Aug 18, 12 AM PDT'
              },
              address: ['Los Angeles State Historic Park, 1245 N Spring St', 'Los Angeles, CA'],
              link: 'https://www.timeout.com/los-angeles/music/the-chainsmokers',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=dFY6jXVQuaxStifS46-99lkwWOziYejPwKKKrcNWVBUcbbAzicARA6ed0mKa9tEd7Kkw8cvdA2jjlGdtYqwtdJz_okoJ6GSmCm-jxVVKmsvCQw6RVrw',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2c65e3534f981:0x4b6311c62cbd36e2?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQIQRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2c65e3534f981%3A0x4b6311c62cbd36e2&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description:
                "Self-proclaimed “frat bro dudes” the Chainsmokers may be the kings of cookie-cutter EDM, but that hasn't stopped them from becoming one of the biggest modern electronic acts. See them at L.A...",
              ticket_info: [
                {
                  source: 'Timeout.com',
                  link: 'https://www.timeout.com/los-angeles/music/the-chainsmokers',
                  link_type: 'tickets'
                },
                {
                  source: 'Insomniac.com',
                  link: 'https://www.insomniac.com/events/the-chainsmokers-2024-08-17-los-angeles-ca/',
                  link_type: 'tickets'
                },
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/events/570726/the-chainsmokers-18-event-tickets',
                  link_type: 'tickets'
                },
                {
                  source: 'Ticketmaster.com',
                  link: 'https://ticketmaster.evyy.net/c/1387536/264167/4272?u=https%3A%2F%2Fthechainsmokers.frontgatetickets.com%2Fevent%2Fwa0b2eus9bogyqc3&SHAREDID=mxxkWSEF',
                  link_type: 'tickets'
                },
                {
                  source: 'Discover Los Angeles',
                  link: 'https://www.discoverlosangeles.com/event/2024/08/17/the-party-never-ends',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Los Angeles State Historic Park',
                rating: 4.6,
                reviews: 3578,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Los+Angeles+State+Historic+Park&ludocid=5432205118390744802&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTIYlFRE5QCCH0aMtqZIYNdqKDcnx-UJJeC-4ZRVgKumyV4J_vGO1cfpIA&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTNB1fFkmhyesv-z-IPuA5fTbrCKll9-WP_-Y4u6S4fw&s=10'
            },
            {
              title: 'Young Miko',
              date: {
                start_date: 'Aug 15',
                when: 'Thu, Aug 15, 8 PM – Fri, Aug 16, 10 PM PDT'
              },
              address: ['Peacock Theater, 777 Chick Hearn Ct', 'Los Angeles, CA'],
              link: 'https://www.peacocktheater.com/events/detail/youngmiko24',
              event_location_map: {
                image:
                  'https://www.google.com/maps/vt/data=ZUBzwXMVg5bvLPVoXXvnR9WDojNxMqpyorHqq6ngV8JnXeyAMo7mNSZ0h5PPctmevupFkY0ZxBhyc2kFJaavYjSO93hrm6-SckcPjXqqKAAPxPpvM8U',
                link: 'https://www.google.com/maps/place//data=!4m2!3m1!1s0x80c2c7b900ec5d7f:0xc71d771bd9c0cf0f?sa=X&ved=2ahUKEwish_O81MSGAxUdr4QIHRBiLVkQ9eIBegQISRAA&hl=en&gl=us',
                serpapi_link:
                  'https://serpapi.com/search.json?data=%214m2%213m1%211s0x80c2c7b900ec5d7f%3A0xc71d771bd9c0cf0f&engine=google_maps&google_domain=google.com&hl=en&q=Events+in+los+angeles&type=place'
              },
              description: 'Young Miko comes to Peacock Theater, in Los Angeles, California, on August 15, 2024.',
              ticket_info: [
                {
                  source: 'Axs.com',
                  link: 'https://www.axs.com/series/22473/young-miko-tickets?skin=peacock&utm_source=peacocktheater&utm_medium=website&utm_campaign=PT_Young_Miko_24',
                  link_type: 'tickets'
                },
                {
                  source: 'L.A. LIVE',
                  link: 'https://www.lalive.com/events/detail/youngmiko24',
                  link_type: 'more info'
                },
                {
                  source: 'Peacock Theater',
                  link: 'https://www.peacocktheater.com/events/detail/youngmiko24',
                  link_type: 'more info'
                },
                {
                  source: 'Spotify',
                  link: 'https://open.spotify.com/concert/38vFTivKLnFMHI55BH0wD9',
                  link_type: 'more info'
                },
                {
                  source: 'Undercover Tourist',
                  link: 'https://www.undercovertourist.com/los-angeles/microsoft-theater/young-miko-tickets/2650201-53343/',
                  link_type: 'more info'
                }
              ],
              venue: {
                name: 'Peacock Theater',
                rating: 4.6,
                reviews: 5846,
                link: 'https://www.google.com/search?sca_esv=2b360afd64c13830&hl=en&gl=us&q=Peacock+Theater&ludocid=14347754949373382415&ibp=gwp%3B0,7'
              },
              thumbnail:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQR8eVPq1WNesBGTHCVnTlqf7apBFrmiObh-WAK_Zs&s',
              image:
                'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcShPg_qYGLoOOOkkjQvKPvPPX-OiVBd69SXRCq9aUCMKA&s=10'
            }
          ]
        }
        setEvents(data.events_results)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    fetchEvents()
  }, [selectedAirport])

  const toggleBookmark = id => {
    setEvents(events.map(event => (event.title === id ? { ...event, bookmarked: !event.bookmarked } : event)))
  }

  const openMaps = link => {
    Linking.openURL(link)
  }

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.eventHeaderText}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventTime}>{item.date.when}</Text>
        </View>
      </View>
      <Text style={styles.eventAddress}>{item.address.join(', ')}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      <View style={styles.eventActions}>
        <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={styles.actionButton}>
          <Text style={styles.actionText}>More Info</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openMaps(item.event_location_map.link)} style={styles.actionButton}>
          <Image source={googleMaps} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleBookmark(item.title)} style={styles.actionButton}>
          <Ionicons name={item.bookmarked ? 'md-bookmark' : 'md-bookmark-outline'} size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4386AD" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load events. Please try again later.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.title}>Discover Local Events</Text>
            <Text style={styles.subtitle}>
              {selectedAirport.city}, {selectedAirport.country}
            </Text>
          </View>
        )}
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.title}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5, // Adjusted spacing
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666'
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 10
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15
  },
  eventHeaderText: {
    flex: 1,
    justifyContent: 'center'
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  eventAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionButton: {
    backgroundColor: '#4386AD',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionText: {
    color: '#FFF',
    marginRight: 5
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  }
})

export default Events
