declare module 'styled-components' {
  import type { ComponentType } from 'react'

  type Interpolation<Props> =
    | string
    | number
    | ((props: Props) => string | number | undefined)

  type AnyProps = Record<string, unknown>

  type StyledTaggedTemplate<Props extends AnyProps> = (
    strings: TemplateStringsArray,
    ...interpolations: Interpolation<Props>[]
  ) => ComponentType<Props>

  type StyledFactory = <Props extends AnyProps = AnyProps>(
    component: ComponentType<Props>
  ) => StyledTaggedTemplate<Props>

  type StyledIntrinsic<Tag extends keyof JSX.IntrinsicElements> = <
    Props extends AnyProps = AnyProps
  >(
    strings: TemplateStringsArray,
    ...interpolations: Interpolation<Props & JSX.IntrinsicElements[Tag]>[]
  ) => ComponentType<Props & JSX.IntrinsicElements[Tag]>

  type Styled = StyledFactory & {
    [Tag in keyof JSX.IntrinsicElements]: StyledIntrinsic<Tag>
  }

  const styled: Styled
  export default styled
}
