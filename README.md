# GitHub Stars datastudio connector

This connector allows you to visualize the GitHub stars that you have on your repo on [datastudio](https://datastudio.google.com/).

## Demo

[Vanilla framework star count](https://datastudio.google.com/reporting/fe5e5df5-3717-40ac-a288-094dcc954df1)
![image](https://user-images.githubusercontent.com/2707508/101328353-cc947380-3867-11eb-96b6-b4701c904f55.png)


## Use it 

- Create a new datasource on datastudio
- Select build your own
- Add deployment ID: `AKfycbxtPWRXvMXKSJEy1C1HVyJjfPuvp1zxwX6BkfBUqZzgonCKnIK9qifrfjyNBxGHexnx`
- Validate
- Select `GitHub Star`
- Enter the repository that you want to visualize
- Click connect
- Et voilà

## Dimensions available

- `Date`: The star date of the GitHub user
- `repository`: The repository selected
- `user`: The user that starred the repository
- `totalStars`: The current amount of stars on your repository
