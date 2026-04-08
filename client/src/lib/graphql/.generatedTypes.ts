export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type FieldWrapper<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type GraphQLBooking = {
  __typename?: 'Booking';
  courtId?: Maybe<FieldWrapper<Scalars['Int']['output']>>;
  courtName?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  date?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  hour?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  id?: Maybe<FieldWrapper<Scalars['ID']['output']>>;
  paid?: Maybe<FieldWrapper<Scalars['Boolean']['output']>>;
  player1?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  player1Id?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  player2?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  player2Id?: Maybe<FieldWrapper<Scalars['String']['output']>>;
};

export type GraphQLCourt = {
  __typename?: 'Court';
  id?: Maybe<FieldWrapper<Scalars['Int']['output']>>;
  name?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  number?: Maybe<FieldWrapper<Scalars['String']['output']>>;
};

export type GraphQLMutation = {
  __typename?: 'Mutation';
  createBooking?: Maybe<FieldWrapper<GraphQLBooking>>;
  deleteBooking?: Maybe<FieldWrapper<Scalars['Boolean']['output']>>;
  updateBooking?: Maybe<FieldWrapper<GraphQLBooking>>;
};


export type GraphQLMutationCreateBookingArgs = {
  courtId?: InputMaybe<Scalars['ID']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  paid?: InputMaybe<Scalars['Boolean']['input']>;
  player2Id?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type GraphQLMutationDeleteBookingArgs = {
  id: Scalars['ID']['input'];
};


export type GraphQLMutationUpdateBookingArgs = {
  courtId?: InputMaybe<Scalars['ID']['input']>;
  date?: InputMaybe<Scalars['String']['input']>;
  hour?: InputMaybe<Scalars['Int']['input']>;
  id: Scalars['ID']['input'];
  paid?: InputMaybe<Scalars['Boolean']['input']>;
  player1Id?: InputMaybe<Scalars['ID']['input']>;
  player2Id?: InputMaybe<Scalars['ID']['input']>;
};

export type GraphQLPage = {
  __typename?: 'Page';
  description?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  image?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  title?: Maybe<FieldWrapper<Scalars['String']['output']>>;
};

export enum GraphQLPageName {
  Home = 'home'
}

export type GraphQLQuery = {
  __typename?: 'Query';
  bookings: Array<FieldWrapper<GraphQLBooking>>;
  courts: Array<FieldWrapper<GraphQLCourt>>;
  page?: Maybe<FieldWrapper<GraphQLPage>>;
  user?: Maybe<FieldWrapper<GraphQLUser>>;
  users?: Maybe<Array<FieldWrapper<GraphQLUser>>>;
};


export type GraphQLQueryBookingsArgs = {
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type GraphQLQueryPageArgs = {
  id: GraphQLPageName;
};


export type GraphQLQueryUserArgs = {
  id: Scalars['ID']['input'];
};

export type GraphQLUser = {
  __typename?: 'User';
  email?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  id?: Maybe<FieldWrapper<Scalars['ID']['output']>>;
  membership?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  membershipId?: Maybe<FieldWrapper<Scalars['Int']['output']>>;
  name?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  role?: Maybe<FieldWrapper<Scalars['String']['output']>>;
  roleId?: Maybe<FieldWrapper<Scalars['Int']['output']>>;
  surname?: Maybe<FieldWrapper<Scalars['String']['output']>>;
};
